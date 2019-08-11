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
var importCss = _interopDefault(require('@atomico/rollup-plugin-import-css'));
var html = _interopDefault(require('parse5'));
var util = require('util');

let isHTML = match("**/*.html");

let ignore = ["#text", "#comment"];

let inject = `[[${Math.random()}]]`;

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
				let code = `import * from ${JSON.stringify(src)};`;

				let isInject = scripts.push(code) == 1;

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

function inputHTML(options = {}) {
	let bundleHTML = {};
	return {
		name: "input-html",
		transform(code, id) {
			if (!isHTML(id)) return;

			bundleHTML[id] = bundleHTML[id] || {};
			if (bundleHTML[id].input !== code) {
				bundleHTML[id].input = code;

				let scripts = [];
				let document = patch([].concat(html.parse(code)), scripts)
					.map(node => html.serialize(node))
					.join("");
				bundleHTML[id].code = scripts.join("");

				bundleHTML[id].output = document;
			}
			return {
				code: bundleHTML[id].code || ""
			};
		},
		generateBundle(opts, bundle) {
			for (let key in bundleHTML) {
				let document = bundleHTML[key];
				if (document.output) {
					let { base: fileName } = path.parse(key);
					bundle[fileName] = {
						fileName,
						isAsset: true,
						source: document.output.replace(
							`<!--${inject}-->`,
							() => {
								if (!document.code) return "";
								let src = `./${fileName.replace(
									/\.html$/,
									".js"
								)}`;
								return options.native
									? `<script type="module" src="${src}"></script>`
									: `
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
								`;
							}
						)
					};

					document.output = "";
				}
			}
		}
	};
}

let asyncReadFile = util.promisify(fs.readFile);

let cwd = process.cwd();

let srcPackage = path.join(cwd, "package.json");

let defaultOutput = {
	dir: "dist",
	format: "es",
	sourcemap: true
};

let pkgDefault = {
	dependencies: {},
	devDependencies: {},
	devDependencies: {},
	babel: {},
	postcss: []
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

async function createBundle(
	{ entry, watch },
	{ output = defaultOutput } = {}
) {
	output = {
		...defaultOutput,
		...output
	};

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
	 * open package.json
	 */
	let pkg = await openPackage(srcPackage);
	let plugins = [
		inputHTML(),
		resolve(),
		importCss({
			plugins: pkg.postcss
		}),
		babel({
			...pkg.babel,
			...{
				exclude: "node_modules/**"
			}
		}),
		...(watch ? [] : [rollupPluginTerser.terser(), sizes()])
	];

	let input = {
		plugins,
		input: entries
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

		watchers[0].on("event", event => {
			if (event.code == "END") {
				console.log(`update`);
			}
		});

		let dirs = [];
		/**
		 * get the root path from the pattern to generate the watcher.
		 * avoid duplicating the watchers, eliminating the depth of the directory.
		 */
		[].concat(entry).map(entry => {
			let root = entry.match(/^([^\/]+)/);
			if (root && !dirs.includes(root[0])) dirs.push(root[0]);
		});
		/**
		 * observe the route(s), to unify with rollup.
		 */
		watchers.push(
			...dirs.map(dir =>
				fs__default.watch(
					path.join(cwd, dir),
					{ recursive: true },
					(type, fileName) => {
						if (type != "rename") return;

						let relative = path
							.join(dir, fileName)
							.replace(/(\\){1,2}/g, "/");

						if (!isInput(relative)) return;

						if (!entries.includes(relative)) {
							write(true);
						}
					}
				)
			)
		);
		watchers.push(
			fs__default.watch(path.join(cwd, "package.json"), async () => {
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

sade("pack <src> [dest]")
	.version("0.0.0")
	.option("-c, --config", "Provide path to custom config", "package.json")
	.option("-w, --watch", "Provide path to custom config")
	.example("src/index.js dist --watch")
	.example("src/*.js dist --watch")
	.example("src/*.html dist --watch")
	.action((src, dir = "dist", opts) => {
		createBundle(
			{
				entry: src.split(/ *, */g),
				watch: opts.watch
			},
			{ dir }
		);
	})
	.parse(process.argv);
