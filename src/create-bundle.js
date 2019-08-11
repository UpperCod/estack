import fs from "fs";
import path from "path";

import match from "picomatch";
import fastGlob from "fast-glob";
import table from "simple-string-table";

import { rollup, watch as watchBundle } from "rollup";
import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import sizes from "@atomico/rollup-plugin-sizes";
import { terser } from "rollup-plugin-terser";
import importCss from "@atomico/rollup-plugin-import-css";

import inputHTML from "./input-html";

import { readFile } from "fs";
import { promisify } from "util";

let asyncReadFile = promisify(readFile);

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

export default async function createBundle(
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
		...(watch ? [] : [terser(), sizes()])
	];

	let input = {
		plugins,
		input: entries
	};

	let bundle = await rollup(input);
	let watchers = [];

	console.log(
		table([["\nINPUT"], ...entries.map(value => ["", value])]) + "\n"
	);

	if (watch) {
		/**
		 * initialize the rollup watcher
		 */
		watchers.push(
			watchBundle({
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
				fs.watch(
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
			fs.watch(path.join(cwd, "package.json"), async () => {
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
