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
var easyImport = _interopDefault(require('postcss-easy-import'));

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

function plugin(options = {}, isInput) {
	let bundleHTML = {};
	let bundleCSS = {};
	return {
		name: "bundle",
		async transform(code, id) {
			let input = isInput(id);
			if (isCSS(id)) {
				let { css } = code.trim()
					? await postcss([
							easyImport(),
							postcssPresetEnv({
								browsers: options.browsers
							}),
							...(options.watch ? [] : [cssnano()])
					  ]).process(code)
					: "";

				if (input) {
					bundleCSS[id] = { css };
				}
				return {
					code: input ? "" : "export default  `" + css + "`;",
					map: { mappings: "" }
				};
			}

			if (isHTML(id) && input) {
				let scripts = [];

				let document = patch([].concat(html.parse(code)), scripts)
					.map(node => html.serialize(node))
					.join("");

				bundleHTML[id] = {
					document,
					code:
						scripts
							.map(src => `import ${JSON.stringify(src)}`)
							.join(";") || ""
				};

				return {
					code: bundleHTML[id].code,
					map: { mappings: "" }
				};
			}
		},
		generateBundle(opts, bundle) {
			for (let key in bundle) {
				let { isEntry, facadeModuleId } = bundle[key];
				if (isEntry && isCSS(facadeModuleId)) {
					delete bundle[key];
				}
			}
			for (let key in bundleCSS) {
				let { css } = bundleCSS[key];
				let { base: fileName } = path.parse(key);
				bundle[fileName] = {
					fileName,
					isAsset: true,
					source: css
				};
				delete bundleCSS[key];
			}
			for (let key in bundleHTML) {
				let { document, code } = bundleHTML[key];
				let { base: fileName } = path.parse(key);
				bundle[fileName] = {
					fileName,
					isAsset: true,
					source: document.replace(`<!--${inject}-->`, () => {
						if (!code) return "";
						let src = `./${fileName.replace(/\.html$/, ".js")}`;
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
									shimport('${src}');
									</script>
									`
							: `<script type="module" src="${src}"></script>`;
					})
				};
				delete bundleHTML[key];
			}
		}
	};
}

let cwd$1 = process.cwd();

function relative(url) {
	return path.relative(cwd$1, url).replace(/(\\){1,2}/g, "/");
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

let srcPackage = path.join(cwd$2, "package.json");

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
	postcss: [],
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

async function createBundle(
	{ entry, watch, ...pkgCli },
	{ output = defaultOutput } = {}
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
	let isInput = (test => url => test(relative(url)))(match(entry));
	/**
	 *
	 * open package.json
	 */

	let plugins = [
		plugin(pkg.bundle, isInput),
		resolve(),
		babel({
			...mergeKeysArray(
				["presets", "plugins"],
				{
					presets: [
						[
							"@babel/preset-env",
							{
								targets: {
									browsers: pkg.bundle.browsers
								}
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
		onwarn() {},
		external: pkg.bundle.external ? Object.keys(pkg.dependencies) : []
	};

	let bundle = await rollup.rollup(input);
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
			if (event.code == "START") {
				lastTime = new Date();
			}
			if (event.code == "END") {
				streamLog(`bundle: ${new Date() - lastTime}ms`);
			}
		});

		let dirs = [];
		/**
		 * get the root path from the pattern to generate the watcher.
		 * avoid duplicating the watchers, eliminating the depth of the directory.
		 */
		[].concat(entry).forEach(entry => {
			let root = entry.match(/^([^\/]+)/);
			if (root && !dirs.includes(root[0])) dirs.push(root[0]);
		});
		/**
		 * observe the route(s), to unify with rollup.
		 */
		watchers.push(
			...dirs.map(dir =>
				fs__default.watch(
					path.join(cwd$2, dir),
					{ recursive: true },
					(type, fileName) => {
						if (type != "rename") return;

						if (!isInput(path.join(cwd$2, dir, fileName))) return;

						if (!entries.includes(relative)) {
							write(true);
						}
					}
				)
			)
		);
		watchers.push(
			fs__default.watch(path.join(cwd$2, "package.json"), async () => {
				let nextPkg = await openPackage(srcPackage);
				if (
					checkFromPackage.some(index => {
						JSON.stringify(pkg[index]) !==
							JSON.stringify(nextPkg[index]);
					})
				)
					write(true);
			})
		);
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
			return createBundle({ entry, watch }, { output });
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
	.option("--browsers", "define the target of the bundle", "last 2 versions")
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
