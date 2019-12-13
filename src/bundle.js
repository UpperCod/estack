import fastGlob from "fast-glob";
import { rollup, watch as watchBundle } from "rollup";
import chokidar from "chokidar";
import { bundleHtml } from "./bundle-html";
import { normalizePath, getPackage, mergeKeysArray } from "./utils";
import pluginCss from "./plugin-css";
import createServer from "./server";

import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import common from "rollup-plugin-commonjs";
import sizes from "@atomico/rollup-plugin-sizes";
import { terser } from "rollup-plugin-terser";
import path from "path";

let namePkg = "package.json";

let isHtml = /\.html$/;

let inputsHtml = {};

let optsDefault = {
  dir: "dist",
  browsers: "> 3%",
  watch: false
};

let extensions = [".js", ".jsx", ".ts", ".tsx"];
/**
 * @type {?Function}
 */
let currentServer;
/**
 *
 * @param {{src:string,dir:string,browsers?:string,watch?:boolean,minify?:boolean,server?:(boolean|number)} } opts
 */
export default async function createBundle(opts, cache) {
  opts = { ...optsDefault, ...opts };
  /**@type {string[]}*/
  let inputs = await fastGlob(opts.src);
  let pkg = await getPackage();

  let babelIncludes = ["node_modules/**"];
  // transform src into valid path to include in babel
  for (let src of opts.src) {
    let { ext, dir } = path.parse(src);

    dir = path.join(dir, "**");
    if (!babelIncludes.includes(dir)) {
      babelIncludes.push(dir);
    }
  }

  let rollupOutput = {
    dir: opts.dir,
    format: "es",
    sourcemap: true,
    chunkFileNames: "chunks/[hash].js"
  };
  // look at the html files given by the expression, to get the input scripts
  await Promise.all(
    inputs
      .filter(file => isHtml.test(file) && !inputsHtml[file])
      .map(async file => {
        inputsHtml[file] = await bundleHtml(file, opts.dir);
      })
  );
  // store the scripts used by html files
  let htmlInputs = [];

  for (let file in inputsHtml) {
    inputsHtml[file].forEach(
      src => !htmlInputs.includes(src) && htmlInputs.push(src)
    );
  }

  /**@type {string[]}*/
  let rollupInputs = inputs
    .filter(file => !isHtml.test(file))
    .filter(file => !htmlInputs.includes(file));

  rollupInputs = rollupInputs.concat(htmlInputs);

  if (!rollupInputs.length) return;

  let rollupInput = {
    input: rollupInputs,
    // when using the flat --external, you avoid adding the dependencies to the bundle
    external: opts.external
      ? [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]
      : [...Object.keys(pkg.peerDependencies)],
    plugins: [
      pluginCss(opts), //use the properties {watch,browsers}
      resolve({ extensions }),
      babel({
        include: babelIncludes,
        extensions,
        //  Merge settings from pkg.bundle
        ...mergeKeysArray(
          ["presets", "plugins"],
          {
            presets: [
              [
                "@babel/preset-typescript",
                {
                  jsxPragma: opts.jsx
                }
              ],
              [
                "@babel/preset-env",
                {
                  targets: opts.browsers,
                  exclude: [
                    /**
                     * to enable or disable preset plugins
                     * {@link https://github.com/babel/babel/blob/master/packages/babel-preset-env/src/available-plugins.js}
                     */
                    "transform-typeof-symbol",
                    "transform-regenerator",
                    "transform-async-to-generator"
                  ]
                }
              ]
            ],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                {
                  pragma: opts.jsx
                }
              ]
            ]
          },
          pkg.babel
        )
      }),
      common(),
      // default minify the code once it escapes the watch
      ...(opts.watch
        ? []
        : opts.minify
        ? [terser({ sourcemap: true })]
        : [sizes()])
    ],
    cache,
    onwarn
  };
  /**@type {Object} */
  let bundle = await rollup(rollupInput);

  /**
   * almacena los watcher en una array para luego
   * eliminar las suscripciones
   */
  let watchers = [];

  if (opts.watch) {
    let rollupWatch = watchBundle({
      ...rollupInput,
      output: rollupOutput,
      watch: { exclude: "node_modules/**" }
    });

    let lastTime;

    rollupWatch.on("event", async event => {
      switch (event.code) {
        case "START":
          lastTime = new Date();
          break;
        case "END":
          streamLog(`bundle: ${new Date() - lastTime}ms`);
          if (currentServer) (await currentServer)();
          break;
        case "ERROR":
          onwarn(event.error);
          break;
      }
    });

    let chokidarWatch = chokidar.watch("file", {});

    chokidarWatch.on("all", async (event, file) => {
      file = normalizePath(file);
      switch (event) {
        case "add":
        case "unlink":
          if (inputs.includes(file) || event == "unlink") return;
          if (isHtml.test(file)) {
            // forces the bundle to ignore the entries of the deleted file
            delete inputsHtml[file];
            build(true);
          }
          break;
        case "change":
          if (file == namePkg) build(true);
          if (isHtml.test(file)) {
            // before each change of the html file, its inputs are obtained again
            delete inputsHtml[file];
            build(true);
          }
          break;
      }
    });

    chokidarWatch.add([opts.src, namePkg]);

    watchers.push(rollupWatch, chokidarWatch);
  }

  async function build(force) {
    if (force) {
      if (opts.watch) {
        watchers.forEach(watcher => watcher.close());
      }
      return createBundle(opts, bundle.cache);
    } else {
      return bundle.write(rollupOutput);
    }
  }

  return build()
    .then(async () => {
      // create a server that is capable of subscribing to bundle changes, for a livereload
      if (opts.server && !currentServer) {
        currentServer = createServer(
          opts.dir,
          opts.watch,
          opts.server == true ? 8080 : opts.server
        );
      } else if (currentServer) {
        (await currentServer)();
      }
    })
    .catch(e => console.log(e));
}

function streamLog(message) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
}

function onwarn(warning) {
  streamLog(warning + "");
}
