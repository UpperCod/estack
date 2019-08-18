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

import { readFile } from "fs";
import { promisify } from "util";

import plugin from "./plugin/index";
import { relative, mergeKeysArray } from "./utils";

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

export default async function createBundle(
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
		...(watch ? [] : [terser(), sizes()])
	];

	let input = {
		plugins,
		input: entries,
		onwarn() {},
		external: pkg.bundle.external ? Object.keys(pkg.dependencies) : []
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
				fs.watch(
					path.join(cwd, dir),
					{ recursive: true },
					(type, fileName) => {
						if (type != "rename") return;

						if (!isInput(path.join(cwd, dir, fileName))) return;

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
