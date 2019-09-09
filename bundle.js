#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sade = _interopDefault(require('sade'));
var fs = require('fs');
var fs__default = _interopDefault(fs);
var path = _interopDefault(require('path'));
var match = _interopDefault(require('picomatch'));
var fastGlob = _interopDefault(require('fast-glob'));
var table = _interopDefault(require('simple-string-table'));
var chokidar = _interopDefault(require('chokidar'));
var rollup = require('rollup');
var babel = _interopDefault(require('rollup-plugin-babel'));
var resolve = _interopDefault(require('rollup-plugin-node-resolve'));
var sizes = _interopDefault(require('@atomico/rollup-plugin-sizes'));
var rollupPluginTerser = require('rollup-plugin-terser');
var util = require('util');
var html = _interopDefault(require('parse5'));
var postcss = _interopDefault(require('postcss'));
var postcssPresetEnv = _interopDefault(require('postcss-preset-env'));
var cssnano = _interopDefault(require('cssnano'));
var atImport = _interopDefault(require('postcss-import'));

let isHTML = match("**/*.html");
let isCSS = match("**/*.css");

let ignore = ["#text", "#comment"];

let inject = `[[${Math.random()}]]`;

let cwd = process.cwd();

function patch(fragment, scripts) {
	let length = fragment.length;
	for (let i = 0; i < length; i++) {
		let node = fragment[i];

		if (ignore.includes(node.nodeName)) continue;

		if (node.nodeName == "script") {
			let length = node.attrs.length;
			let isModule;
			let src;
			while (length--) {
				let { name, value } = node.attrs[length];
				if (name == "type" && value == "module") {
					isModule = true;
				}
				if (name == "src" && /^\.\//.test(value)) {
					src = value;
				}
			}
			if (isModule && src) {
				let isInject = scripts.push(src) == 1;

				fragment[i] = {
					nodeName: isInject ? "#comment" : "#text",
					[isInject ? "data" : "value"]: isInject ? inject : "",
					parentNode: fragment[i].parentNode
				};
			}
		} else {
			node.childNodes && patch(node.childNodes, scripts);
		}
	}
	return fragment;
}

function plugin(options = {}) {
	let bundleHTML = {};
	return {
		name: "bundle",
		async transform(code, id) {
			let { isEntry } = this.getModuleInfo(id);
			if (isCSS(id)) {
				let { name, dir } = path.parse(id);
				let { css } = code.trim()
					? await postcss([
							atImport({
								resolve: file => {
									let id = path.join(
										/^\./.test(file)
											? dir
											: path.join(cwd, "node_modules"),
										file
									);
									// Add an id to bundle.watchFile
									this.addWatchFile(id);
									return id;
								}
							}),
							postcssPresetEnv({
								stage: 0,
								browsers: options.browsers
							}),
							...(options.watch ? [] : [cssnano()])
					  ]).process(code)
					: "";

				if (isEntry) {
					let fileName = name + ".css";
					this.emitFile({
						type: "asset",
						name: fileName,
						fileName,
						source: css || ""
					});
				}
				return {
					code: isEntry ? "" : "export default  `" + css + "`;",
					map: { mappings: "" }
				};
			}

			if (isHTML(id) && isEntry) {
				let { name } = path.parse(id);
				let fileName = name + ".html";
				let scripts = [];

				let document = patch([].concat(html.parse(code)), scripts)
					.map(node => html.serialize(node))
					.join("");

				let script =
					scripts
						.map(src => `import ${JSON.stringify(src)}`)
						.join(";") || "";

				let src = `${fileName.replace(/\.html$/, ".js")}`;

				this.emitFile({
					type: "asset",
					name: fileName,
					fileName,
					source: document.replace(`<!--${inject}-->`, () => {
						if (!script) return "";

						return options.shimport
							? `
									<script>
									function shimport(src) {
										try {
										new Function('import("' + src + '")')();
										} catch (e) {
										var s = document.createElement('script');
										s.src = 'https://unpkg.com/shimport';
										s.dataset.main = src;
										document.head.appendChild(s);
										}
									}
									shimport('./${src}');
									</script>
									`
							: `<script type="module" src="./${src}"></script>`;
					})
				});

				bundleHTML[src] = script;

				return {
					code: script,
					map: { mappings: "" }
				};
			}
		},
		generateBundle(opts, bundle) {
			for (let key in bundle) {
				let { isEntry, facadeModuleId, fileName } = bundle[key];
				if (
					isEntry &&
					(isCSS(facadeModuleId) ||
						(fileName in bundleHTML && !bundleHTML[fileName]))
				) {
					delete bundle[key];
				}
			}
		}
	};
}

let cwd$1 = process.cwd();

function normalizePath(path) {
	return path.replace(/(\\+)/g, "/");
}

function mergeKeysArray(keys, ...config) {
	keys.forEach(index => {
		config[0][index] = Array.from(
			new Map(
				config.reduce(
					(nextConfig, config) =>
						nextConfig.concat(
							(config[index] || []).map(value =>
								Array.isArray(value) ? value : [value]
							)
						),
					[]
				)
			)
		);
	});
	return config[0];
}

let asyncReadFile = util.promisify(fs.readFile);

let cwd$2 = process.cwd();

let namePkg = "package.json";

let srcPackage = path.join(cwd$2, namePkg);

let defaultOutput = {
	dir: "dist",
	format: "es",
	sourcemap: true
};

let pkgDefault = {
	dependencies: {},
	devDependencies: {},
	peerDependencies: {},
	babel: {},
	bundle: {}
};

let checkFromPackage = Object.keys(pkgDefault);

async function openPackage(src) {
	try {
		return {
			...pkgDefault,
			...JSON.parse(await asyncReadFile(src, "utf8"))
		};
	} catch {
		return pkgDefault;
	}
}

function streamLog(message) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(message);
}

function onwarn(warning) {
	streamLog(warning + "");
}

async function createBundle(
	{ entry, watch, ...pkgCli },
	output,
	cache
) {
	output = {
		...defaultOutput,
		...output
	};
	let pkg = await openPackage(srcPackage);

	pkg.bundle = { watch, ...pkgCli, ...pkg.bundle };

	/**
	 * get  entries for rollup
	 */
	let entries = await fastGlob(entry);
	/**
	 * generate a validator to use with the watchers
	 * This will be used to regenerate the bundle only
	 * if the created file is part of the observed root
	 */
	let isInput = match(entry);
	/**
	 *
	 * open package.json
	 */

	let plugins = [
		plugin(pkg.bundle),
		resolve(),
		babel({
			...mergeKeysArray(
				["presets", "plugins"],
				{
					presets: [
						[
							"@babel/preset-env",
							{
								targets: pkg.bundle.browsers
							}
						]
					],
					plugins: [
						[
							"@babel/plugin-transform-react-jsx",
							{
								pragma: "h"
							}
						]
					]
				},
				pkg.babel
			),
			...{
				exclude: "node_modules/**"
			}
		}),
		...(watch ? [] : [rollupPluginTerser.terser(), sizes()])
	];

	let input = {
		plugins,
		input: entries,
		cache,
		onwarn,
		external: pkg.bundle.external
			? [
					...Object.keys(pkg.dependencies),
					...Object.keys(pkg.peerDependencies)
			  ]
			: []
	};

	let bundle;
	try {
		bundle = await rollup.rollup(input);
	} catch (err) {
		onwarn(err);
		return;
	}

	let watchers = [];

	console.log(
		table([["\nINPUT"], ...entries.map(value => ["", value])]) + "\n"
	);

	if (watch) {
		/**
		 * initialize the rollup watcher
		 */
		watchers.push(
			rollup.watch({
				...input,
				output,
				watch: { exclude: "node_modules/**" }
			})
		);
		let lastTime;
		watchers[0].on("event", event => {
			switch (event.code) {
				case "START":
					lastTime = new Date();
					break;
				case "END":
					streamLog(`bundle: ${new Date() - lastTime}ms`);
					break;
				case "ERROR":
					onwarn(event.error);
					break;
			}
		});

		/**
		 * observe the route(s), to unify with rollup.
		 */

		let watcher = chokidar.watch("file");

		watcher.on("all", async (event, path) => {
			switch (event) {
				case "add":
				case "unlink":
					path = normalizePath(path);
					if (entries.includes(path) && event == "add") return;
					if (isInput(path)) {
						write(true);
					}
					break;
				case "change":
					if (path == namePkg) {
						let nextPkg = await openPackage(srcPackage);
						if (
							checkFromPackage.some(
								index =>
									JSON.stringify(pkg[index]) !==
									JSON.stringify(nextPkg[index])
							)
						) {
							write(true);
						}
					}
					break;
			}
		});

		watcher.add([...entry, namePkg]);

		watchers.push(watcher);
	}
	/**
	 * force writing or bundle generation
	 * @param {boolean} force - if true this regenerate the bundle
	 * @returns {Promise}
	 */
	let write = async force => {
		if (force) {
			if (watch) {
				watchers.forEach(watcher => watcher.close());
			}
			return createBundle({ entry, watch }, output, bundle.cache);
		} else {
			return bundle.write(output);
		}
	};

	await write();
}

sade("bundle [src] [dest]")
	.version("0.0.0")
	.option(
		"-w, --watch",
		"Watch files in bundle and rebuild on changes",
		false
	)
	.option(
		"-e, --external",
		"Does not include dependencies in the bundle",
		false
	)
	.option("--shimport", "enable the use of shimport in the html", false)
	.option("--browsers", "define the target of the bundle", "> 3%")
	.example("src/index.js dist --watch")
	.example("src/*.js dist")
	.example("src/*.html")
	.example("")
	.action((src, dir = "dist", opts) => {
		createBundle(
			{
				...opts,
				entry: src ? src.split(/ *, */g) : []
			},
			{ dir }
		);
	})
	.parse(process.argv);
