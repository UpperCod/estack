#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sade = _interopDefault(require('sade'));
var path = _interopDefault(require('path'));
var glob = _interopDefault(require('fast-glob'));
var rollup = _interopDefault(require('rollup'));
var yaml = _interopDefault(require('js-yaml'));
var marked = _interopDefault(require('marked'));
var Mustache = _interopDefault(require('mustache'));
var parse5 = _interopDefault(require('parse5'));
var fs = _interopDefault(require('fs'));
var postcss = _interopDefault(require('postcss'));
var postcssPresetEnv = _interopDefault(require('postcss-preset-env'));
var cssnano = _interopDefault(require('cssnano'));
var atImport = _interopDefault(require('postcss-import'));
var babel = _interopDefault(require('rollup-plugin-babel'));
var resolve = _interopDefault(require('@rollup/plugin-node-resolve'));
var common = _interopDefault(require('@rollup/plugin-commonjs'));
var sizes = _interopDefault(require('@atomico/rollup-plugin-sizes'));
var replace = _interopDefault(require('@rollup/plugin-replace'));
var rollupPluginTerser = require('rollup-plugin-terser');
var net = _interopDefault(require('net'));
var Koa = _interopDefault(require('koa'));
var send = _interopDefault(require('koa-send'));
var http = _interopDefault(require('http'));
var chokidar = _interopDefault(require('chokidar'));

function serializeHtml(astHtml) {
  return parse5.serialize(astHtml);
}
/**
 * parses an html document node to node
 * @param {string} content
 * @param {function(Node)} map
 * @param {boolean} useFragment
 * @returns {Object} astHtml
 */
function analyzeHtml(content, map, useFragment) {
  let astHtml = parse5[useFragment ? "parseFragment" : "parse"](content);
  let parallel = [];

  function consume(astHtml) {
    astHtml.map(node => {
      parallel.push(
        map({
          ...node,
          setAttribute(name, value) {
            node.attrs = node.attrs.map(attr =>
              attr.name == name ? { name, value } : attr
            );
          },
          getAttribute(name) {
            return node.attrs
              .filter(attr => attr.name == name)
              .reduce((_, { value }) => value, null);
          }
        })
      );
      if (
        !["script", "pre", "code", "style"].includes(node.nodeName) &&
        node.childNodes
      ) {
        consume(node.childNodes);
      }
    });
  }

  map && consume(astHtml.childNodes);

  return Promise.all(parallel).then(() => astHtml);
}

/**
 * @typedef {Object} Node
 * @property {string} nodeName
 * @property {(name:string,value:string)=>void} setAttribute
 * @property {(name:string)=>string|null} getAttribute
 */

const asyncFs = fs.promises;

const cwd = process.cwd();

const pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {}
};

const isUrl = file => /^(http(s){0,1}:){0,1}\/\//.test(file);

const asyncGroup = group => Promise.all(group);

const isHtml = file => /\.(md|html)/.test(file);

const isMd = file => /\.md$/.test(file);

const isJs = file => /\.(js|ts|jsx,tsx)$/.test(file);

const isCss = file => /\.css$/.test(file);

const isFixLink = file => isHtml(file) || isJs(file) || isCss(file);

const isNotFixLink = file => !isFixLink(file);

function readFile(file) {
  return asyncFs.readFile(path.join(cwd, file), "utf8");
}

async function writeFile(file, data) {
  let dir = path.join(cwd, path.parse(file).dir);
  try {
    await asyncFs.stat(dir);
  } catch (e) {
    await asyncFs.mkdir(dir, {
      recursive: true
    });
  }

  return asyncFs.writeFile(path.join(cwd, file), data, "utf8");
}

function mergeKeysArray(keys, ...config) {
  keys.forEach(index => {
    config[0][index] = Array.from(
      new Map(
        config.reduce(
          (nextConfig, config) =>
            nextConfig.concat(
              (config[index] || []).map(value =>
                Array.isArray(value) ? value : [value]
              )
            ),
          []
        )
      )
    );
  });

  return config[0];
}

async function getPackage() {
  try {
    return {
      ...pkgDefault,
      ...JSON.parse(await readFile("package.json"))
    };
  } catch (e) {
    return { ...pkgDefault };
  }
}

async function copyFile(src, dest) {
  src = path.join(cwd, src);
  dest = path.join(cwd, dest);
  let [statSrc, statDest] = await Promise.all([
    asyncFs.stat(src).catch(() => null),
    asyncFs.stat(dest).catch(() => null)
  ]);
  if (statSrc && (!statDest || statSrc.ctimeMs != statDest.ctimeMs)) {
    if (!statDest) {
      await asyncFs.mkdir(path.parse(dest).dir, {
        recursive: true
      });
    }
    await asyncFs.copyFile(src, dest);
  }
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

function createAwait() {
  let resolve;
  let reject;
  let promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
}

async function readHtml({ code, addFile, useFragment }) {
  const astHtml = await analyzeHtml(
    code,
    async node => {
      if (node.nodeName == "link") {
        const isHrefImport = ["stylesheet", "manifest", "preload"].includes(
          node.getAttribute("rel")
        );
        const href = node.getAttribute("href");
        if (isHrefImport && href && !isUrl(href)) {
          node.setAttribute("href", await addFile(href));
        }
      } else if (["script", "img", "video"].includes(node.nodeName)) {
        const src = node.getAttribute("src");
        if (src && !isUrl(src)) {
          node.setAttribute("src", await addFile(src));
        }
      }
    },
    useFragment
  );
  return serializeHtml(astHtml);
}

async function readCss({ file, code, addWatchFile, minify, browsers }) {
  const { dir } = path.parse(file);

  const plugins = [
    atImport({
      resolve: file => {
        file = path.join(
          /^\./.test(file) ? dir : path.join(cwd, "node_modules"),
          file
        );
        // Add an id to bundle.watchFile
        addWatchFile && addWatchFile(file);
        return file;
      }
    }),
    postcssPresetEnv({
      stage: 0,
      browsers
    })
  ];

  minify && plugins.push(cssnano());

  code = await postcss(plugins).process(code, { from: undefined });

  return code.css;
}

function pluginImportCss(options = {}) {
  return {
    name: "plugin-import-css",
    async transform(code, id) {
      if (isCss(id)) {
        return {
          code: `export default ${JSON.stringify(
            await readCss({
              file: id,
              code,
              minify: options.minify,
              browsers: options.browsers,
              addWatchFile: id => this.addWatchFile(id)
            })
          )}`,
          map: { mappings: "" }
        };
      }
    }
  };
}

let extensions = [".js", ".jsx", ".ts", ".tsx"];

function rollupPlugins(options) {
  let babelIncludes = ["node_modules/**"];
  // transform src into valid path to include in babel
  for (let src of options.src) {
    let { dir } = path.parse(src);

    dir = path.join(dir, "**");
    if (!babelIncludes.includes(dir)) {
      babelIncludes.push(dir);
    }
  }

  return [
    pluginImportCss(options),
    resolve({
      extensions,
      dedupe: ["react", "react-dom"]
    }),
    babel({
      include: babelIncludes,
      extensions,
      ...mergeKeysArray(
        ["presets", "plugins"],
        {
          presets: [
            [
              "@babel/preset-typescript",
              options.jsx == "react"
                ? {}
                : {
                    jsxPragma: options.jsx
                  }
            ],
            [
              "@babel/preset-env",
              {
                targets: options.browsers,
                modules: false,
                exclude: [
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
                  options.jsx == "react" ? "React.createElement" : options.jsx,
                pragmaFrag:
                  options.jsxFragment == "react" || options.jsx == "react"
                    ? "React.Fragment"
                    : options.jsxFragment
              }
            ],
            ["@babel/plugin-proposal-optional-chaining"],
            ["@babel/plugin-syntax-nullish-coalescing-operator"],
            ["@babel/plugin-proposal-class-properties"]
          ]
        },
        options.babel
      )
    }),
    common(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    ...(options.watch
      ? []
      : options.minify
      ? [rollupPluginTerser.terser({ sourcemap: options.sourcemap }), sizes()]
      : [sizes()])
  ];
}

async function createServer({ dest, watch, port: portStart = 8000 }) {
  const [port, reloadPort] = await Promise.all([
    findPort(portStart, portStart + 100),
    findPort(5000, 5080)
  ]);

  const serverStatic = new Koa();

  serverStatic.use(async ctx => {
    let url = path.join(dest, ctx.path == "/" ? "index.html" : ctx.path);

    if (!/\.[^\.]+$/.test(url)) url += ".html";

    if (isHtml(url) && watch) {
      let file = await asyncFs.readFile(url, "binary");
      ctx.status = 200;
      ctx.set("Content-Type", "text/html");
      ctx.set("Access-Control-Allow-Origin", "*");
      ctx.set("Cache-Control", "no-cache");
      ctx.body = file += `
        <script>
          const source = new EventSource('http://localhost:${reloadPort}');
          source.onmessage = e =>  location.reload();
        </script>
      `;
    } else {
      await send(ctx, url);
    }
  });

  serverStatic.listen(port);
  const responses = [];

  if (watch) {
    http
      .createServer((req, res) => {
        // Open the event stream for live reload
        res.writeHead(200, {
          Connection: "keep-alive",
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*"
        });
        // Send an initial ack event to stop any network request pending
        sendMessage(res, "connected", "awaiting change");
        // Send a ping event every minute to prevent console errors
        setInterval(sendMessage, 60000, res, "ping", "still waiting");
        // Watch the target directory for changes and trigger reload

        responses.push(res);
      })
      .listen(reloadPort);
  }

  console.log(`\nserver running on http://localhost:${port}\n`);

  return {
    reload() {
      if (watch)
        responses.forEach(res => sendMessage(res, "message", "reloading page"));
    }
  };
}

function sendMessage(res, channel, data) {
  res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
  res.write("\n\n");
}

async function findPort(port, limit, pending) {
  if (!pending) {
    pending = {};
    pending.promise = new Promise((resolve, reject) => {
      pending.resolve = resolve;
      pending.reject = reject;
    });
  }
  const client = net.createConnection({ port });
  client.on("connect", () => {
    client.end();
    if (port > limit) {
      pending.reject();
    } else {
      findPort(port + 1, limit, pending);
    }
  });
  client.on("error", () => pending.resolve(port));

  return pending.promise;
}

function watch(glob, listener) {
  let currentGroup;

  const loadGroup = () => {
    if (!currentGroup) {
      currentGroup = {};
      setTimeout(() => {
        listener(currentGroup);
        currentGroup = false;
      }, 200);
    }
  };

  const watcher = chokidar.watch(glob);

  ["add", "change", "unlink"].map(type => {
    watcher.on(type, file => {
      loadGroup();
      (currentGroup[type] = currentGroup[type] || []).push(file);
    });
  });

  return watcher;
}

async function createBundle(options) {
  options = await formatOptions(options);

  let files = await glob(options.src);

  // groups all manipulated files, prevents files
  // that have not been modified from being regenerated
  const mapFiles = new Map();

  // define if a file has already been manipulated
  const isReady = file => mapFiles.has(file);

  // !isReady
  const isNotReady = file => !isReady(file);

  // define if a file is of type template
  const isTemplate = file => options.template == file;

  // !isTempalte
  const isNotTemplate = file => !isTemplate(file);

  // delete the file, for new manipulation or
  // regeneration without the given file
  const deleteFile = file => {
    mapFiles.delete(file);
    return file;
  };

  // add a file to the registry and prevent a manipulation
  // job on it if it is verified with isReady
  const takeFile = file => {
    mapFiles.set(file, {
      imported: []
    });
    return file;
  };

  // cache stat generated by adding a file
  // This is used by searches in exportable files with only isHtml type...
  const cacheStat = new Map();

  // get the name of the file at the destination
  const getLink = file => {
    let { name, ext } = path.parse(file);
    return isFixLink(ext)
      ? name + (isJs(ext) ? ".js" : isMd(ext) ? ".html" : ext)
      : "file-" +
          file.split("").reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
          ext;
  };
  // get the final destination name
  const getDest = (file, folder = "") => path.join(options.dest, folder, file);

  // returns folder retracements based on relative path depth
  const getRelativeDeep = file =>
    file
      ? path
          .normalize(file)
          .split(path.sep)
          .map(() => "../")
          .join("")
      : "";

  // promise to be resolved if watch mode has been enabled
  // allows to wait for the watch to complete to add a
  // new file to the queue, for a new regeneration
  const awaitWatch = createAwait();

  // date of last build
  let lastTime = new Date();
  // group the watchers to clean between each build
  let watchers = [];

  // store the server, eg: server.reload()
  let server;

  if (options.server) {
    server = await createServer({
      dest: options.dest,
      watch: options.watch,
      port: options.port
    });
  }

  /**
   * regenerate the build
   * @param {string[]} files
   * @param {boolean} forceJs
   * @returns {Promise<void>}
   */
  async function readFiles(files, forceJs) {
    // normalize to avoid duplicates
    files = files.map(path.normalize);

    // check if one of the files is a template
    await asyncGroup(
      files
        .filter(isTemplate)
        .map(takeFile)
        .map(async file => {
          const template = mapFiles.get(file);
          const [code, meta] = getMetaFile(await readFile(file));

          template.meta = meta;
          template.code = code;

          // before each file regeneration, the associates are restarted,
          // in this case those that comply with isHtml
          [...mapFiles]
            .map(([file]) => file)
            .filter(isHtml)
            .filter(isNotTemplate)
            .map(deleteFile)
            .forEach(file => {
              if (!files.includes(file)) files.push(file);
            });
        })
    );

    // ignore template files
    files = files.filter(isNotTemplate);

    // the html are of high hierarchy, since through them the
    // exportable ones are identified to work for the inferior porcesos
    let groupHtml = files
      .filter(isHtml)
      .filter(isNotReady)
      .map(takeFile)
      .map(async file => {
        const { dir } = path.parse(file);
        let [code, meta] = getMetaFile(await readFile(file));
        const relativeDeep = getRelativeDeep(meta.folder);

        if (isMd(file)) {
          code = marked(code);
        }

        const nextCode = await readHtml({
          code,
          useFragment: options.template ? true : false,
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

              if (options.watch && exists) {
                awaitWatch.promise.then(({ addFile }) => addFile(findFile));
              }
            }

            if (!cacheStat.get(findFile)) return childFile;

            if (!files.includes(findFile)) {
              files.push(findFile);
            }

            if (!mapFiles.get(file).imported.includes(findFile)) {
              mapFiles.get(file).imported.push(findFile);
            }

            return relativeDeep + getLink(findFile);
          }
        });
        return {
          file,
          link: getLink(file),
          code: nextCode,
          meta
        };
      });

    groupHtml = await asyncGroup(groupHtml);

    // create an array that groups all files that comply with isHtml
    const pages = groupHtml.map(({ link, meta }) => ({ link, meta }));
    // write the html files, the goal of this being done separately,
    // is to group the pages before writing to metadata
    await asyncGroup(
      groupHtml.map(({ link, code, meta, file }) => {
        let template;
        if (options.template) {
          template = mapFiles.get(options.template);
        }

        if (template) {
          code = Mustache.render(
            meta.template === false ? code : template.code,
            {
              theme: template.meta,
              pages,
              page: { link, meta }
            },
            {
              content: code
            }
          );
        }

        writeFile(getDest(link, meta.folder), code);
      })
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
            const nextCode = await readCss({
              file,
              code,
              minify: options.minify,
              browsers: options.browsers,
              addWatchFile(childFile) {
                if (options.watch) {
                  awaitWatch.promise.then(({ addFile }) =>
                    addFile(childFile, file)
                  );
                }
              }
            });
            return writeFile(getDest(getLink(file)), nextCode);
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
      forceJs ||
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
        plugins: rollupPlugins(options)
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
              server && server.reload();
              break;
            case "ERROR":
              streamLog(event.error);
              break;
          }
        });

        watchers.push(watcher);
      }

      await bundle.write(output);
    } else {
      streamLog(`bundle: ${new Date() - lastTime}ms`);
      server && server.reload();
    }
  }
  try {
    await readFiles(files);

    if (options.watch) {
      const mapSubWatch = new Map();
      const isRootWatch = file =>
        mapSubWatch.has(file) ? !mapSubWatch.get(file).length : true;

      const watcher = watch(options.src, group => {
        let files = [];
        let forceJs;

        if (group.add) {
          let groupFiles = group.add
            .filter(isRootWatch)
            .filter(isFixLink)
            .filter(isNotReady);
          files = [...files, ...groupFiles];
        }
        if (group.change) {
          let groupChange = group.change;
          group.change
            .filter(file => mapSubWatch.has(file))
            .map(file => mapSubWatch.get(file))
            .reduce(
              (groupParent, groupChild) => groupParent.concat(groupChild),
              []
            )
            .forEach(file => {
              if (!groupChange.includes(file)) groupChange.push(file);
            });

          let groupFiles = groupChange
            .filter(file => isRootWatch(file) || isReady(file))
            .filter(isFixLink)
            .filter(file => !isJs(file))
            .map(deleteFile);

          files = [...files, ...groupFiles];
        }
        if (group.unlink) {
          if (
            group.unlink
              .filter(isJs)
              .filter(isReady)
              .map(deleteFile).length
          ) {
            forceJs = true;
          }
        }
        if (files.length || forceJs) {
          lastTime = new Date();
          readFiles(files, forceJs);
        }
      });
      awaitWatch.resolve({
        addFile(file, parentFile) {
          if (!mapSubWatch.has(file)) {
            mapSubWatch.set(file, []);
            watcher.add(file);
          }
          if (parentFile && !mapSubWatch.get(file).includes(parentFile)) {
            mapSubWatch.get(file).push(parentFile);
          }
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function formatOptions({ src = [], config, external, ...ignore }) {
  const pkg = await getPackage();

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
    ...pkg[config]
  };

  if (options.template) {
    options.src.unshift((options.template = path.normalize(options.template)));
  }

  return options;
}

function getMetaFile(code) {
  let meta = {};
  code = code.replace(/---\s([.\s\S]*)\s---\s/, (all, content, index) => {
    if (!index) {
      meta = yaml.safeLoad(content);
      return "";
    }
    return all;
  });
  return [code, meta];
}

sade("bundle [src] [dest]")
  .version("0.15.3")
  .option("-w, --watch", "Watch files in bundle and rebuild on changes", false)
  .option("-e, --external", "Does not include dependencies in the bundle")
  .option(
    "-c, --config",
    "allows you to export a configuration from package.json"
  )
  .option("--sourcemap", "enable the use of sourcemap", true)
  .option("--server", "Create a server, by default localhost:8000", false)
  .option("--port", "define the server port", 8000)
  .option("--browsers", "define the target of the bundle", "> 3%")
  .option("--template", "define the top template file for html or md")
  .option("--jsx", "pragma jsx", "h")
  .option("--jsxFragment", "pragma fragment jsx", "Fragment")
  .option(
    "--minify",
    "minify the code only if the flag --watch is not used",
    false
  )
  .example("src/index.html dist --watch --server")
  .example("src/index.html dist --external")
  .example("src/index.html dist --external react,react-dom")
  .example("src/index.js dist --watch")
  .example("src/*.js dist")
  .example("src/*.html")
  .example("")
  .action((src, dest = "dest", options) => {
    createBundle({
      ...options,
      src,
      dest
    }).catch(e => console.log("" + e));
  })
  .parse(process.argv);
