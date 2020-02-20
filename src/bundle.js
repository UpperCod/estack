import rollup from "rollup";
import glob from "fast-glob";
import readHtml from "./read-html";
import rollupConfig from "./rollup/config-plugins";
import { getPackage, normalizePath, requireExternal } from "./utils";
import createServer from "./server/create-server";
import chokidar from "chokidar";

let isHtml = /\.(html|md)$/;

let htmlExports = [
  "script[type=module][:src]",
  "link[:href][rel=stylesheet]",
  "link[:href][rel=manifest]",
  "link[:href][rel=shortcut icon]",
  "img[:src]",
  "video[:src]"
];

export default async function createBundle(options) {
  let watchers = [];
  let server;
  let lastTime;
  let cache;
  let currentBuild;
  let rebuild = () => (currentBuild = build(options));

  streamLog("...loading");

  options = await formatOptions(options);

  if (options.server) {
    server = await createServer(options);
  }

  async function build(options) {
    // close the observers created within the scope build
    watchers.forEach(watch => watch.close());

    watchers = [];

    let inputs = await glob(options.src);

    let [inputsHtml, inputsRollup] = inputs.reduce(
      ([inputsHtml, inputsRollup], src) => {
        (isHtml.test(src) ? inputsHtml : inputsRollup).push(src);
        return [inputsHtml, inputsRollup];
      },
      [[], []]
    );

    let html = await Promise.all(
      inputsHtml.map(src =>
        readHtml({
          src,
          dir: options.dir,
          exports: htmlExports,
          markdownTemplate: options.markdownTemplate,
          markdownConfigTemplate: options.markdownConfigTemplate
        })
      )
    );

    inputsRollup = html.reduce(
      (inputsRollup, html) => [
        ...inputsRollup,
        ...html.exports.filter(src => !inputsRollup.includes(src))
      ],
      inputsRollup
    );

    let markdownData = {
      custom: options.markdownConfigTemplate,
      pages: html
        .filter(({ ext }) => ext == ".md")
        .map(({ link, meta }) => ({ link, meta }))
    };

    await Promise.all(html.map(html => html.write(markdownData)));

    let rollupInput = {
      cache,
      onwarn: streamLog,
      input: inputsRollup,
      external: options.external,
      ...rollupConfig(options)
    };

    let rollupOutput = {
      dir: options.dir,
      format: "es",
      sourcemap: options.sourcemap,
      chunkFileNames: "chunks/[hash].js"
    };

    let bundle = await rollup.rollup(rollupInput);

    cache = bundle.cache;

    if (options.watch) {
      let rollupWatch = rollup.watch({
        ...rollupInput,
        output: rollupOutput,
        watch: { exclude: "node_modules/**" }
      });

      rollupWatch.on("event", async event => {
        switch (event.code) {
          case "START":
            lastTime = new Date();
            break;
          case "END":
            streamLog(`bundle: ${new Date() - lastTime}ms`);
            if (server) server.reload();
            break;
          case "ERROR":
            streamLog(event.error);
            break;
        }
      });

      watchers.push(rollupWatch);
    }

    bundle.write(rollupOutput);

    return [...inputsHtml, ...inputsRollup];
  }

  rebuild();

  if (options.watch) {
    let chokidarWatch = chokidar.watch("file", {});

    chokidarWatch.on("all", async (event, file) => {
      let files = await currentBuild;

      file = normalizePath(file);

      let exist = files.includes(file);

      switch (event) {
        case "unlink":
          if (exist) rebuild();
          break;
        case "change":
          if (isHtml.test(file)) rebuild();
          break;
        case "add":
          if (!exist) rebuild();
      }
    });

    chokidarWatch.add([options.src, "package.json"]);
  }
}

async function formatOptions({ src = [], config, external, ...ignore }) {
  let pkg = await getPackage();
  src = Array.isArray(src) ? src : src.split(/ *, */g);

  if (external) {
    external = Array.isArray(external)
      ? external
      : [true, "true"].includes(external)
      ? Object.keys(pkg.dependencies)
      : external.split(/ *, */);
  }

  external = [...(external || []), ...Object.keys(pkg.peerDependencies)];

  let pkgConfig = pkg[config] || {};

  let [markdownTemplate, markdownConfigTemplate = {}] = [].concat(
    pkgConfig.markdownTemplate
  );

  markdownTemplate = markdownTemplate ? requireExternal(markdownTemplate) : {};

  return {
    babel: {},
    src,
    external,
    babel: pkg.babel,
    ...ignore,
    ...pkgConfig,
    markdownTemplate,
    markdownConfigTemplate
  };
}

function streamLog(message) {
  message = message + "";
  try {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(message);
  } catch (e) {
    console.log(message);
  }
}
