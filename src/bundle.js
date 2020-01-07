import fastGlob from "fast-glob";
import { rollup, watch as watchBundle } from "rollup";
import chokidar from "chokidar";
import { bundleHtml } from "./bundle-html";
import { normalizePath, getPackage, mergeKeysArray } from "./utils";
import pluginCss from "./plugin-css";
import pluginUnpkg from "./plugin-unpkg";
import { pluginForceExternal, DOUBLE_SLASH } from "./plugin-force-external";
import createServer from "./server";

import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";
import sizes from "@atomico/rollup-plugin-sizes";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import path from "path";

let namePkg = "package.json";

let isHtml = /\.(html|md)$/;
bundleHtml;

let inputsHtml = {};

let optsDefault = {
  dir: "dist",
  browsers: "> 3%"
};

let extensions = [".js", ".jsx", ".ts", ".tsx"];
/**
 * @type {?Function}
 */
let currentServer;
/**
 * @param {Object} opts
 * @param {string[]} opts.src
 * @param {string} [opts.dir]
 * @param {string} [opts.browsers]
 * @param {boolean} [opts.watch]
 * @param {boolean} [opts.server]
 * @param {number} [opts.port]
 * @param {boolean|"unpkg"} opts.external
 * @param {string} [opts.config]
 * @param {string} [opts.jsx]
 * @param {jsxFragment} [opts.jsxFragment]
 * @param {string} [opts.importmap]
 * @param {boolean} [opts.minify] - minifies the js and css, this option is ignored if the flag watch is used
 * @param {string[]} [opts.htmlInject] - allows to inject the html generated nodes in the head, based on emmet type expressions, eg `script[src=url]`
 * @param {string[]} [opts.htmlExports] - allows you to add more export exprations from the html, eg `my-element[:src]`
 */
export default async function createBundle(opts, cache) {
  /**@type {Package} */
  let pkg = await getPackage();

  // merge config
  opts = { ...optsDefault, ...opts, ...pkg[opts.config] };

  //normalizes the value
  opts.external = opts.external == "false" ? false : opts.external;

  /**@type {string[]}*/
  let inputs = await fastGlob(opts.src);

  let babelIncludes = ["node_modules/**"];

  // transform src into valid path to include in babel
  for (let src of opts.src) {
    let { dir } = path.parse(src);

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
        inputsHtml[file] = await bundleHtml(
          file,
          opts.dir,
          /\.(js|ts|tsx|jsx|css)$/,
          opts.htmlExports,
          opts.htmlInject
        );
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

  let external =
    opts.external || opts.importmap
      ? [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]
      : [...Object.keys(pkg.peerDependencies)];

  let rollupInput = {
    input: rollupInputs,
    // when using the flat --external, you avoid adding the dependencies to the bundle
    external: opts.external == "unpkg" || opts.importmap ? [] : external,
    plugins: [
      pluginForceExternal(),
      pluginUnpkg(opts, external),
      pluginCss(opts), //use the properties {watch,browsers}
      replace({
        [DOUBLE_SLASH]: "",
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
      resolve({
        extensions,
        dedupe: ["react", "react-dom"]
      }),
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
                opts.jsx == "react"
                  ? {}
                  : {
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
                  pragma:
                    opts.jsx == "react" ? "React.createElement" : opts.jsx,
                  pragmaFrag:
                    opts.jsxFragment == "react" || opts.jsx == "react"
                      ? "React.Fragment"
                      : opts.jsxFragment
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
          if (currentServer) currentServer.then(reload => reload());
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
        currentServer = createServer(opts.dir, opts.watch, opts.port);
      } else if (currentServer) {
        currentServer.then(reload => reload());
      }
    })
    .catch(e => console.log(e));
}

function streamLog(message) {
  try {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(message);
  } catch (e) {
    console.log(message);
  }
}

function onwarn(warning) {
  streamLog(warning + "");
}

/**
 * @typedef {Object} Package
 * @property {Object} dependencies
 * @property {Object} [peerDependencies]
 * @property {{plugins:any[],presets:any[]}} [babel]
 */
