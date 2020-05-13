import glob from "fast-glob";
import path from "path";
import rollup from "rollup";
import servor from "servor";
import {
  isJs,
  isMd,
  isCss,
  isHtml,
  isFixLink,
  isNotFixLink,
  readFile,
  asyncFs,
  streamLog,
  writeFile,
  normalizePath,
  getPackage,
  getMetaFile,
  getFileName,
  getRelativePath,
  getRelativeDeep,
} from "./utils";
import { rollupPlugins } from "./rollup/config-plugins";
import { readHtml } from "./read-html";
import { readCss } from "./read-css";
import { renderHtml } from "./template";
import { renderMarkdown } from "./markdown";
import { watch } from "./watch";

export async function createBundle(options) {
  // formatea las opciones
  options = await formatOptions(options);

  // optiene la lista a base de la exprecion de entrada
  let files = await glob(options.src);
  // alamcena el estado de los archivos procesados
  let inputs = {};

  let deleteInput = (file) => {
    delete inputs[file];
    return file;
  };
  // optiene el destino del fichero a escribir
  let getDest = (file, folder = "") =>
    normalizePath(path.join(options.dest, folder, file));

  // evita que el archivo se procese mas de 2 veces
  let prevenLoad = (file) => {
    if (file in inputs) {
      return false;
    } else {
      return (inputs[file] = true);
    }
  };

  let isPreventLoad = (file) => file in inputs;

  let isNotPreventLoad = (file) => !isPreventLoad(file);

  // date of last build
  let lastTime = new Date();
  // historial de observadores
  let rollupWatchers = [];
  // cache de rollup
  let rollupCache;

  let fileWatcher;

  async function load(files, forceBuild) {
    lastTime = new Date();
    files = files.map(path.normalize);

    let rebuildHtml = [];

    let nestedFiles = await Promise.all(
      files
        .filter(isHtml)
        .filter(prevenLoad)
        .map(async (file) => {
          rebuildHtml.push(file);

          let { dir } = path.parse(file);
          let [code, meta] = getMetaFile(await readFile(file));

          let name = getFileName(file);
          let dest = getDest(name, meta.folder);
          let link = path.join("./", meta.folder || "", name);
          let nestedFiles = [];

          let content = await readHtml({
            code,
            async addFile(childFile) {
              let findFile = path.join(dir, childFile);
              try {
                await asyncFs.stat(findFile);
                nestedFiles.push(findFile);
                return "{{deep}}" + getFileName(findFile);
              } catch (e) {
                return childFile;
              }
            },
          });

          if (isMd(file)) {
            content = renderMarkdown(content);
          }

          inputs[file] = {
            ...meta,
            name,
            content,
            link,
            dest,
            nestedFiles,
          };

          return nestedFiles;
        })
    );

    files = [...files, ...nestedFiles.flat()];

    let groupAsync = files
      .filter(isCss)
      .filter(prevenLoad)
      .map(async (file) => {
        let css = await readFile(file);
        let code = await readCss({
          code: css,
          file,
          addWatchFile(childFile) {
            if (options.watch) {
              fileWatcher(childFile, file);
            }
          },
        });
        return writeFile(getDest(getFileName(file)), code);
      });

    if (rebuildHtml.length) {
      let templates = {};
      let filesHtml = Object.keys(inputs)
        .filter(isHtml)
        .map((file) => {
          let data = inputs[file];
          if (inputs[file].template) {
            templates[inputs[file].template] = data;
            return;
          }
          return data;
        })
        .filter((value) => value);

      let groupAsyncHtml = filesHtml.map((page) => {
        let layout = templates[page.layout];

        let pages = filesHtml.map((subPage) => ({
          ...page,
          link: getRelativePath(page.link, subPage.link),
        }));

        let data = {
          pkg: options.pkg,
          page,
          pages,
          layout: layout || {},
          deep: getRelativeDeep(page.folder) || "./",
        };

        let content = renderHtml(page.content, data);

        if (layout) {
          content = renderHtml(layout.content, {
            ...data,
            page: {
              ...page,
              content,
            },
          });
        }

        return writeFile(page.dest, content);
      });

      groupAsync = [...groupAsync, ...groupAsyncHtml];
    }

    await Promise.all([
      ...groupAsync, // Proceso asincrono de css + html
      ...files // Copia los archivos estaticos
        .filter(isNotFixLink)
        .filter(prevenLoad)
        .map(async (file) => copyFile(file, getDest(getLink(file)))),
      ...(files.filter(isJs).filter(prevenLoad).length || forceBuild
        ? [loadRollup()]
        : []), // añade rollup a la cola solo cuando es necesario
    ]);

    streamLog(`bundle: ${new Date() - lastTime}ms`);
  }

  async function loadRollup() {
    rollupWatchers.filter((watcher) => watcher.close());
    rollupWatchers = [];

    let input = {
      input: Object.keys(inputs).filter(isJs),
      onwarn: streamLog,
      external: options.external,
      cache: rollupCache,
      plugins: rollupPlugins(options),
    };

    if (input.input.length) {
      let output = {
        dir: options.dest,
        format: "es",
        sourcemap: options.sourcemap,
        chunkFileNames: "chunks/[hash].js",
      };

      let bundle = await rollup.rollup(input);

      rollupCache = bundle.cache;

      if (options.watch) {
        let watcher = rollup.watch({
          ...input,
          output,
          watch: { exclude: "node_modules/**" },
        });

        watcher.on("event", async (event) => {
          switch (event.code) {
            case "START":
              lastTime = new Date();
              break;
            case "END":
              streamLog(`bundle: ${new Date() - lastTime}ms`);
              break;
            case "ERROR":
              streamLog(event.error);
              break;
          }
        });

        rollupWatchers.push(watcher);
      }

      await bundle.write(output);
    }
  }

  if (options.watch) {
    let mapSubWatch = {};
    let isRootWatch = (file) =>
      mapSubWatch[file] ? !Object.keys(mapSubWatch).length : true;

    let watcher = watch(options.src, (group) => {
      let files = [];
      let forceBuild;

      if (group.add) {
        let groupFiles = group.add
          .filter(isRootWatch)
          .filter(isFixLink)
          .filter(isNotPreventLoad);
        files = [...files, ...groupFiles];
      }
      if (group.change) {
        let groupChange = group.change;

        groupChange = [
          ...groupChange,
          ...group.change
            .filter((file) => mapSubWatch[file])
            .map((file) => Object.keys(mapSubWatch[file]))
            .flat(),
        ];

        let groupFiles = groupChange
          .filter((file) => isRootWatch(file) || isPreventLoad(file))
          .filter(isFixLink)
          .filter((file) => !isJs(file))
          .map(deleteInput);

        files = [...files, ...groupFiles];
      }
      if (group.unlink) {
        group.unlink.forEach(deleteInput);
        forceBuild = true;
      }
      if (files.length || forceBuild) {
        load(files, forceBuild);
      }
    });

    fileWatcher = (file, parentFile) => {
      if (!mapSubWatch[file]) {
        mapSubWatch[file] = {};
        watcher.add(file);
      }
      if (parentFile) {
        mapSubWatch[file][parentFile] = true;
      }
    };
  }

  if (options.server) {
    let instance = await servor({
      root: options.dest,
      fallback: "index.html",
      port: options.port,
      reload: true,
      inject: "",
    });
    console.log(instance);
  }

  return load(files);
}

async function formatOptions({ src = [], config, external, ...ignore }) {
  let pkg = await getPackage();

  src = Array.isArray(src) ? src : src.split(/ *; */g);

  if (external) {
    external = Array.isArray(external)
      ? external
      : [true, "true"].includes(external)
      ? Object.keys(pkg.dependencies)
      : external.split(/ *, */);
  }

  external = [...(external || []), ...Object.keys(pkg.peerDependencies)];

  let options = {
    src,
    external,
    babel: pkg.babel,
    ...ignore,
    ...pkg[config],
    pkg,
  };

  // normalize routes for fast-glob
  options.src = options.src.map(normalizePath);

  return options;
}
