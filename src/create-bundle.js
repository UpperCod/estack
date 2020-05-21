import glob from "fast-glob";
import path from "path";
import rollup from "rollup";
import builtins from "builtin-modules";
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
import { createServer } from "./create-server";
import { rollupPlugins } from "./rollup/config-plugins";
import { readHtml } from "./read-html";
import { readCss } from "./read-css";
import { renderHtml } from "./template";
import { renderMarkdown } from "./markdown";
import { watch } from "./watch";
/**
 * @todo search how to incorporate the automatic generation of minimum pwa
 * next block, line:290
 *
 * // import { createSw } from "./create-sw";
 */

let SyntaxErrorTransforming = `SyntaxError: Error transforming`;

export async function createBundle(options) {
  streamLog("loading...");

  let loadingStep = 3;

  let server;

  // date of last build
  let lastTime = new Date();

  let rollupWatchers = [];
  // cache de rollup
  let rollupCache;

  let fileWatcher;

  // stores the status of processed files
  let inputs = {};

  const loadingInterval = setInterval(() => {
    if (server) return;
    loadingStep = loadingStep == 0 ? 3 : loadingStep;
    streamLog("loading" + ".".repeat(loadingStep--));
  }, 250);
  // format options
  options = await formatOptions(options);

  // get list based on input expression
  let files = await glob(options.src);

  let deleteInput = (file) => {
    delete inputs[file];
    return file;
  };
  /**
   * returns the write destination of the file
   * @param {string} file - file name
   * @param {string} [folder] - If defined, add the folder to the destination
   */
  let getDest = (file, folder = "") =>
    normalizePath(path.join(options.dest, folder, file));

  /**
   * prevents the file from working more than once
   * @param {string} file
   */
  let prevenLoad = (file) => {
    if (file in inputs) {
      return false;
    } else {
      return (inputs[file] = true);
    }
  };
  /**
   * Check if the file is locked
   * @param {string} file
   * @returns {boolean}
   */
  let isPreventLoad = (file) => file in inputs;
  /**
   * check if the file can be processed
   * @param {stirng} file
   * @return {boolean}
   */
  let isNotPreventLoad = (file) => !isPreventLoad(file);

  if (options.server) {
    try {
      server = await createServer({
        root: options.dest,
        port: options.port,
        reload: options.watch,
        proxy: options.proxy,
      });
    } catch (e) {
      console.log(e);
    }

    streamLog("");
    console.log(`\nserver running on http://localhost:${server.port}\n`);
  }

  clearInterval(loadingInterval);

  /**
   * initialize the processing queue on related files
   * @param {string[]} files - list of files to process
   * @param {*} forceBuild
   */
  async function load(files, forceBuild) {
    // reset build start time
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
          let html = await readFile(file);
          let data = [html, {}];

          try {
            data = getMetaFile(html);
          } catch (e) {
            streamLog(
              `${SyntaxErrorTransforming} ${file}:${e.mark.line}:${e.mark.position}`
            );
          }
          let [code, meta] = data;

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
                fileWatcher && fileWatcher(findFile, file);
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
            file,
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
              fileWatcher && fileWatcher(childFile, file);
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

      let groupAsyncHtml = filesHtml.map(async (page) => {
        let layout = templates[page.layout == null ? "default" : page.layout];

        let data = {
          pkg: options.pkg,
          page,
          layout,
          deep: getRelativeDeep(page.folder) || "./",
          pages: filesHtml.map((subPage) => ({
            ...subPage,
            content: null,
            link: getRelativePath(page.link, subPage.link),
          })),
        };

        try {
          let content = await renderHtml(page.content, data);
          return { ...data, page: { ...page, content } };
        } catch (e) {
          streamLog(`${SyntaxErrorTransforming} : ${page.file}`);
        }
      });

      groupAsync = [
        ...groupAsync,
        // Improve the execution of parallel tasks, to speed up the build
        Promise.all(groupAsyncHtml).then((pages) =>
          Promise.all(
            // Write the files once all have generated render of their
            // individual content, this in order to create pages that
            // group the content of other pages already processed
            pages
              .filter((data) => data)
              .map(async (data) => {
                let content = data.page.content;
                if (data.layout) {
                  try {
                    content = await renderHtml(data.layout.content, {
                      ...data,
                      pages: pages.map(({ page: subPage }) => ({
                        ...subPage,
                        link: getRelativePath(data.page.link, subPage.link),
                      })),
                    });
                  } catch (e) {
                    streamLog(`${SyntaxErrorTransforming} : ${layout.file}`);
                  }
                }

                if (content != null) {
                  return writeFile(data.page.dest, content);
                }
              })
          )
        ),
      ];
    }

    // parallel queue of asynchronous processes
    await Promise.all([
      ...groupAsync,
      ...files // copy of static files
        .filter(isNotFixLink)
        .filter(prevenLoad)
        .map(async (file) => copyFile(file, getDest(getLink(file)))),
      ...(files.filter(isJs).filter(prevenLoad).length || forceBuild
        ? [loadRollup()]
        : []), // add rollup to queue only when needed
    ]);
    /**
     * @todo search how to incorporate the automatic generation of minimum pwa
     * //if (options.pwa && !options.watch) {
     * //  let normalDest = normalizePath(options.dest);
     * //  let filesDest = await glob(normalizePath(path.join(options.dest, "**")));
     * //  let sw = createSw(options.pkg.name, [
     * //    "/",
     * //    ...filesDest.map((file) => file.replace(normalDest, ".")),
     * //  ]);
     * //  await writeFile(path.join(options.dest, "sw.js"), sw);
     * //}
     */

    streamLog(`bundle: ${new Date() - lastTime}ms`);

    server && server.reload();
  }
  async function loadRollup() {
    // clean the old watcher
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
              server && server.reload();
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
    // map defining the cross dependencies between child and parents
    let mapSubWatch = {};
    /**
     * defines if the file is a parent
     * @param {string} file
     */
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

        files = [...files, ...groupFiles]
          .map((file) =>
            mapSubWatch[file]
              ? Object.keys(mapSubWatch[file]).map(deleteInput)
              : file
          )
          .flat();
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

  return load(files);
}

async function formatOptions({
  src = [],
  config,
  external,
  jsx,
  jsxFragment,
  ...ignore
}) {
  let pkg = await getPackage();

  src = Array.isArray(src) ? src : src.split(/ *; */g);

  if (external) {
    external = Array.isArray(external)
      ? external
      : [true, "true"].includes(external)
      ? Object.keys(pkg.dependencies)
      : external.split(/ *, */);
  }

  external = [
    ...builtins,
    ...(external || []),
    ...Object.keys(pkg.peerDependencies),
  ];

  let options = {
    src,
    external,
    babel: pkg.babel,
    ...ignore,
    ...pkg[config],
    pkg,
    jsx: jsx == "react" ? "React.createElement" : jsx,
    jsxFragment: jsx == "react" ? "React.Fragment" : jsxFragment,
  };

  // normalize routes for fast-glob
  options.src = options.src.map(normalizePath);

  return options;
}
