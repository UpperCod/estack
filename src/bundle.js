import path from "path";
import glob from "fast-glob";
import rollup from "rollup";
import { readHtml } from "./read-html";
import { readCss } from "./read-css";
import { rollupPlugins } from "./rollup/config-plugins";
import { createServer } from "./server/create-server";

import {
  asyncFs,
  readFile,
  writeFile,
  copyFile,
  asyncGroup,
  isHtml,
  isJs,
  isCss,
  isFixLink,
  isNotFixLink,
  streamLog,
  getPackage
} from "./utils";
import { watch } from "./watch";

export default async function createBundle(options) {
  options = await formatOptions(options);

  let files = await glob(options.src);

  const mapFiles = new Map();

  const isReady = file => mapFiles.has(file);

  const isNotReady = file => !isReady(file);

  const takeFile = file => {
    mapFiles.set(file, {
      imported: []
    });
    return file;
  };

  const cacheStat = new Map();

  const getLink = file => {
    let { name, ext } = path.parse(file);
    return isFixLink(ext)
      ? name + (isJs(ext) ? ".js" : ext)
      : "file-" +
          file.split("").reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
          ext;
  };

  const getDest = file => path.join(options.dest, file);

  let lastTime = new Date();
  let watchers = [];

  let server;

  if (options.server) {
    server = await createServer({
      dest: options.dest,
      watch: options.watch,
      port: options.port
    });
  }

  async function readFiles(files) {
    let groupHtml = await files
      .filter(isHtml)
      .filter(isNotReady)
      .map(takeFile)
      .map(async file => {
        const { dir } = path.parse(file);
        const { meta, code } = await readHtml({
          code: await readFile(file),
          async addFile(childFile) {
            const findFile = path.join(dir, childFile);

            if (!cacheStat.has(findFile)) {
              let exists = true;
              try {
                await asyncFs.stat(findFile);
              } catch (e) {
                exists = false;
              }
              cacheStat.set(findFile, exists);
            }

            if (!cacheStat.get(findFile)) return childFile;

            if (!files.includes(findFile)) {
              files.push(findFile);
            }
            if (!mapFiles.get(file).imported.includes(findFile)) {
              mapFiles.get(file).imported.push(findFile);
            }

            return getLink(findFile);
          }
        });
        return {
          link: getLink(file),
          code,
          meta
        };
      });

    groupHtml = await asyncGroup(groupHtml);

    const pages = groupHtml.map(({ link, meta }) => ({ link, meta }));
    // write the html files, the goal of this being done separately,
    // is to group the pages before writing to metadata
    await asyncGroup(
      groupHtml.map(({ link, code, meta }) => writeFile(getDest(link), code))
    );
    // parallel task block
    await asyncGroup([
      asyncGroup(
        files
          .filter(isCss)
          .filter(isNotReady)
          .map(takeFile)
          .map(async file => {
            const code = await readFile(file);
            const nextCode = await readCss({ file, code });
            if (nextCode != code) {
              return writeFile(getDest(getLink(file)), code);
            }
          })
      ),
      asyncGroup(
        files
          .filter(isNotFixLink)
          .filter(isNotReady)
          .map(takeFile)
          .map(async file => copyFile(file, getDest(getLink(file))))
      )
    ]);

    // Rollup only restarts if a new js has been added from external sources
    if (
      files
        .filter(isJs)
        .filter(isNotReady)
        .map(takeFile).length
    ) {
      watchers = watchers.filter(watcher => {
        watcher.close();
      });

      const input = {
        input: [...mapFiles].map(([file]) => file).filter(isJs),
        onwarn: streamLog,
        external: options.external,
        plurgins: rollupPlugins(options)
      };

      const output = {
        dir: options.dest,
        format: "es",
        sourcemap: options.sourcemap,
        chunkFileNames: "chunks/[hash].js"
      };

      const bundle = await rollup.rollup(input);

      if (options.watch) {
        const watcher = rollup.watch({
          ...input,
          output,
          watch: { exclude: "node_modules/**" }
        });

        watcher.on("event", async event => {
          switch (event.code) {
            case "START":
              lastTime = new Date();
              break;
            case "END":
              streamLog(`bundle: ${new Date() - lastTime}ms`);
              server.reload();
              break;
            case "ERROR":
              streamLog(event.error);
              break;
          }
        });

        watchers.push(watcher);
      }

      await bundle.write(output);
    }
  }
  try {
    await readFiles(files).then(server.reload);
    await watch(options.src, () => {});
  } catch (e) {
    console.log(e);
  }
}

async function formatOptions({ src = [], config, external, ...ignore }) {
  const pkg = await getPackage();

  src = Array.isArray(src) ? src : src.split(/ *, */g);

  if (external) {
    external = Array.isArray(external)
      ? external
      : [true, "true"].includes(external)
      ? Object.keys(pkg.dependencies)
      : external.split(/ *, */);
  }

  external = [...(external || []), ...Object.keys(pkg.peerDependencies)];

  const pkgConfig = pkg[config] || {};

  return {
    babel: {},
    src,
    external,
    babel: pkg.babel,
    ...ignore,
    ...pkgConfig
  };
}
