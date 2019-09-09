import fs from "fs";
import path from "path";

import match from "picomatch";
import fastGlob from "fast-glob";
import table from "simple-string-table";
import chokidar from "chokidar";

import { rollup, watch as watchBundle } from "rollup";

import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import sizes from "@atomico/rollup-plugin-sizes";
import { terser } from "rollup-plugin-terser";

import { readFile } from "fs";
import { promisify } from "util";

import plugin from "./plugin/index";
import { mergeKeysArray, normalizePath } from "./utils";

let asyncReadFile = promisify(readFile);

let cwd = process.cwd();

let namePkg = "package.json";

let srcPackage = path.join(cwd, namePkg);

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

export default async function createBundle(
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
		...(watch ? [] : [terser(), sizes()])
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
		bundle = await rollup(input);
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
			watchBundle({
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
