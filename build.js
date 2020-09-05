#!/usr/bin/env node
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var createTree = require('@uppercod/imported');
var glob = require('fast-glob');
var strFragment = require('@uppercod/str-fragment');
var mapObject = require('@uppercod/map-object');
var createCache = require('@uppercod/cache');
var getProp = require('@uppercod/get-prop');
var request = require('@uppercod/request');
var jsYaml = require('js-yaml');
var liquidjs = require('liquidjs');
var fs = require('fs');
var http = require('http');
var findPort = require('@uppercod/find-port');
var mime = require('mime');
var hash = require('@uppercod/hash');
var chokidar = require('chokidar');
var fs$1 = require('fs/promises');

async function load(build, listSrc, isRoot) {
    const currentFiles = listSrc.reduce((currentFiles, src) => {
        const nextSrc = build.getSrc(src);
        if (!build.isAssigned(nextSrc)) {
            currentFiles[nextSrc] = build.addFile(nextSrc, isRoot);
        }
        return currentFiles;
    }, {});
    const [task] = build.plugins.reduce(([task, currentFiles], plugin) => {
        const selectFiles = [];
        for (let src in currentFiles) {
            const file = currentFiles[src];
            if (plugin.filter && plugin.filter(file)) {
                file.errors = [];
                file.alerts = [];
                file.assigned = true;
                selectFiles.push(file);
            }
        }
        if (selectFiles.length && plugin.load) {
            task.push((async () => {
                await plugin.load(selectFiles, build);
            })());
        }
        return [task, currentFiles];
    }, [[], currentFiles]);
    await Promise.all(task);
}

function frontmatter(src, content) {
    const [fragment] = strFragment.getFragments(content, {
        open: /^---/m,
        end: /^---/m,
        equal: true,
    });
    if (fragment) {
        const { open, end } = fragment;
        if (!open.indexOpen) {
            let metadata = "";
            const nextContent = strFragment.replaceFragments(content, [fragment], ({ content }) => {
                metadata = content;
                return "";
            });
            return [nextContent, metadata];
        }
    }
    return [content, ""];
}

let isYaml = (src) => /\.y(a){0,1}ml$/.test(src);
let isJson = (src) => /\.json$/.test(src);
let isUrl = (src) => /^(http(s){0,1}:){0,1}\/\//.test(src);
let isHtml = (src) => /\.(md|html)/.test(src);
let isJs = (src) => /\.(js|ts|jsx|tsx)$/.test(src);

const yamlLoad = (code, src) => jsYaml.safeLoad(code, { filename: src });
const cache = createCache();
async function loadData(rootFile) {
    const value = await rootFile.read();
    rootFile.dataAsync =
        rootFile.dataAsync ||
            mapObject({
                file: rootFile.src,
                value: yamlLoad(value, rootFile.src),
            }, {
                async $link({ value }) {
                    return rootFile.addLink(value);
                },
                async $ref({ value, root }) {
                    let data = root;
                    const [, src, prop] = value.match(/([^#|~]*)(?:(?:#|~)(?:\/){0,1}(.*)){0,1}/);
                    if (isUrl(src)) {
                        const [, content, res] = await cache(request.request, src);
                        const contentType = res.headers["content-type"];
                        data = /json/.test(contentType)
                            ? JSON.parse(content)
                            : /yaml/.test(contentType)
                                ? yamlLoad(content, src)
                                : content;
                    }
                    else if (src) {
                        const result = await rootFile.addChild(src);
                        const { root } = await result.dataAsync;
                        data = root;
                    }
                    return prop ? getProp(data, prop) : data;
                },
            });
    const { root } = await rootFile.dataAsync;
    return root;
}

let normalizePath = (str) => str
    .replace(/[\\\/]+/g, "/")
    .replace(/[\s\(\)\[\]\$\#\?\&\=\¿\!\¡\"\'\{\}\@\<\>\´\`]+/g, "-")
    .replace(/\-+/g, "-")
    .toLowerCase();

async function loadFile(rootFile) {
    const [html, metadata] = frontmatter(rootFile.src, await rootFile.read());
    const copyRootFile = { ...rootFile };
    copyRootFile.read = () => Promise.resolve(metadata);
    const data = metadata ? {} : await loadData(copyRootFile);
    let { link = "", folder = "", permalink, slug, content: _content } = data;
    const content = _content || html;
    const name = slug || rootFile.name;
    link = link || permalink;
    if (link) {
        rootFile.setLink((link += /\/$/.test(link) || link == "/" ? "index.html" : ".html"));
    }
    else {
        rootFile.setLink(folder, name + ".html");
    }
    rootFile.data = {
        ...data,
        content,
        link: rootFile.link,
        slug: normalizePath(name),
        file: normalizePath(rootFile.src),
    };
}

function createEngine() {
    const cache = createCache();
    const engine = new liquidjs.Liquid({
        cache: true,
        dynamicPartials: false,
    });
    const parse = (template) => engine.parse(template);
    return (template, data) => engine.render(cache(parse, template), data);
}

function pluginHtml() {
    return {
        name: "html",
        mounted() {
            this.render = createEngine();
        },
        filter: ({ src }) => isHtml(src),
        async load(currentFiles, { files }) {
            await Promise.all(currentFiles.map(loadFile));
            const templates = {};
            const pages = {};
            const global = {};
            for (const src in files) {
                if (!isHtml(src))
                    continue;
                const file = files[src];
                const { data } = file;
                if (data.global) {
                    if (global[data.global]) {
                        file.addAlert(`Duplicate global: ${data.global}`);
                    }
                    global[data.global] = data;
                }
                if (data.archive) ;
                else if (data.fragment) ;
                else if (data.template) {
                    templates[src] = file;
                }
                else {
                    if (pages[file.link]) {
                        file.addError(`Duplicate links: ${data.link}`);
                        continue;
                    }
                    pages[file.link] = file;
                }
            }
            const task = [];
            const renderPage = async (file) => {
                const renderData = {
                    file,
                    global,
                    page: file.data,
                };
                try {
                    renderData.file.content = await this.render(file.data.content, renderData);
                    return renderData;
                }
                catch (e) {
                    renderData.file.addError(e);
                }
            };
            const renderTemplate = async (renderData) => {
                if (!renderData)
                    return;
                const { page, file } = renderData;
                const { layout = "default" } = page;
                const template = templates[layout];
                if (template) {
                    renderData.layout = template.data;
                    renderData.page = { ...page, content: file.content };
                    try {
                        file.content = await this.render(template.data.content, renderData);
                    }
                    catch (e) {
                        renderData.file.addError(e);
                    }
                }
            };
            for (const link in pages) {
                task.push(renderPage(pages[link]));
            }
            await Promise.all(task).then((pages) => Promise.all(pages.map(renderTemplate)));
        },
    };
}

function pluginData() {
    return {
        name: "data",
        filter: ({ src }) => isYaml(src) || isJson(src),
        async load(files) {
            await Promise.all(files.map(loadData));
        },
    };
}

function createLiveReload(path, port) {
    const responses = [];
    const sendMessage = (res, channel, data) => {
        res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
        res.write("\n\n");
    };
    const middleware = (res) => {
        res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        });
        sendMessage(res, "connected", "awaiting change");
        setInterval(sendMessage, 60000, res, "ping", "still waiting");
        responses.push(res);
    };
    const addScriptLiveReload = (code) => (code += `
        <script>{
        let source = new EventSource('http://localhost:${port}${path}');
        source.onmessage = e =>  setTimeout(()=>location.reload(),250);
        }</script>
    `);
    const reload = () => {
        responses.forEach((res) => sendMessage(res, "message", "reloading"));
    };
    return {
        responses,
        reload,
        middleware,
        addScriptLiveReload,
    };
}

async function createServer(options) {
    const port = await findPort(options.port, options.port + 100);
    const pathLiveReload = "/livereload";
    let sources = {};
    http.createServer((req, res) => {
        if (req.url == pathLiveReload) {
            livereload.middleware(res);
            return;
        }
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-cache");
        const file = sources[req.url];
        if (file) {
            const mime$1 = mime.getType(file.type);
            if (file.assigned && typeof file.content == "string") {
                res.writeHead(200, { "Content-Type": mime$1 + ";charset=utf-8" });
                res.end(file.type == "html"
                    ? livereload.addScriptLiveReload(file.content)
                    : file.content);
            }
            else {
                const readStream = fs.createReadStream(file.src);
                readStream.on("open", () => {
                    res.writeHead(200, { "Content-Type": mime$1 });
                    readStream.pipe(res);
                });
                readStream.on("error", () => {
                    notFound(res);
                });
            }
        }
        else {
            notFound(res);
        }
    }).listen(port);
    const livereload = createLiveReload(pathLiveReload, port);
    return {
        reload: (nextSources) => {
            sources = nextSources;
            livereload.reload();
        },
    };
}
const notFound = (res) => {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("");
};

function pluginServer() {
    return {
        name: "server",
        async mounted() {
            this.server = await createServer({ port: 8000 });
        },
        afterLoad({ files }) {
            const sources = {};
            for (const src in files) {
                sources[files[src].link] = files[src];
            }
            this.server.reload(sources);
        },
    };
}

const createDataDest = (options) => (file) => {
    let { name, ext, dir, base } = path.parse(file);
    ext = isJs(ext) ? ".js" : isHtml(ext) ? ".html" : ext || ".html";
    const typeHtml = ext == ".html";
    const isIndex = typeHtml && name == "index";
    if (!options.assetsWithoutHash.test(ext)) {
        const data = {
            hash: hash(file),
            name,
        };
        name = options.assetHashPattern.replace(/\[([^\]]+)\]/g, (all, prop) => data[prop] || "");
        if (name.indexOf(data.hash) == -1) {
            name = data.hash + "-" + name;
        }
    }
    const destDir = typeHtml ? dir : options.assetsDir;
    const dest = normalizePath(path.join(options.dest, destDir, name + ext));
    const link = normalizePath(path.join(options.href, destDir, isIndex ? "./" : name + (typeHtml ? "" : ext)));
    return {
        base: name + ext,
        name,
        link,
        dest,
        type: ext.replace(".", ""),
        raw: {
            base,
            file: normalizePath(file),
            dir,
        },
    };
};

function createWatch({ glob, listener, delay, normalize }) {
    let currentGroup;
    const loadGroup = () => {
        if (!currentGroup) {
            currentGroup = {};
            setTimeout(() => {
                listener(currentGroup);
                currentGroup = null;
            }, delay || 200);
        }
    };
    const watcher = chokidar.watch(glob, { ignoreInitial: true });
    ["add", "change", "unlink"].map((type) => {
        watcher.on(type, (file) => {
            loadGroup();
            currentGroup[type] = currentGroup[type] || [];
            file = normalize ? normalize(file) : file;
            if (!currentGroup[type].includes(file)) {
                currentGroup[type].push(file);
            }
        });
    });
    return watcher;
}

const utf = "utf8";
const cwd = process.cwd();
const localFile = (file) => path.join(cwd, file);
const readFile = (file) => fs$1.readFile(localFile(file), utf);

async function createBuild(src) {
    const listSrc = await glob(src);
    const tree = createTree();
    const getDest = createDataDest({
        assetHashPattern: "[hash]-[name]",
        assetsWithoutHash: /\.(html|js)/,
        assetsDir: "assets",
        dest: "build",
        href: "/",
    });
    const getSrc = (src) => path.normalize(src);
    const hasFile = (src) => tree.has(getSrc(src));
    const getFile = (src) => tree.get(getSrc(src));
    const isAssigned = (src) => {
        if (hasFile(src)) {
            return getFile(src).assigned;
        }
        return false;
    };
    const addFile = (src, isRoot) => {
        src = getSrc(src);
        const file = tree.get(src);
        if (isRoot)
            tree.add(src);
        if (!file.setLink) {
            Object.assign(file, {
                ...getDest(src),
                errors: [],
                alerts: [],
                read: () => readFile(src),
                join: (src) => path.join(file.raw.dir, src),
                async addChild(src) {
                    src = getSrc(file.join(src));
                    const exist = build.hasFile(src);
                    tree.addChild(file.src, src);
                    if (!exist) {
                        watcher.add(src);
                        await load(build, [src]);
                    }
                    return build.getFile(src);
                },
                async addLink(src) {
                    if (isHtml(src)) {
                        const nextSrc = file.join(src);
                        return {
                            get link() {
                                return getFile(nextSrc).link;
                            },
                            get linkTitle() {
                                return getFile(nextSrc).data.linkTitle;
                            },
                        };
                    }
                    else {
                        const { link, raw: { base: linkTitle }, } = await file.addChild(src);
                        return { link, linkTitle };
                    }
                },
                setLink(...args) {
                    const link = normalizePath(path.join(...args));
                    Object.assign(file, getDest(link));
                    return file.link;
                },
                addError(message) {
                    if (!file.errors.includes(message)) {
                        file.errors.push(message);
                    }
                },
                addAlert(message) {
                    if (!file.errors.includes(message)) {
                        file.errors.push(message);
                    }
                },
            });
        }
        return file;
    };
    const build = {
        mode: "dev",
        global: {},
        files: tree.tree,
        plugins: [pluginServer(), pluginHtml(), pluginData()],
        getSrc,
        addFile,
        hasFile,
        getFile,
        isAssigned,
    };
    const pluginsCall = (method) => Promise.all(build.plugins.map((plugin) => typeof plugin[method] == "function" && plugin[method](build)));
    await pluginsCall("mounted");
    const cycle = async (listSrc) => {
        await pluginsCall("beforeLoad");
        await load(build, listSrc, true);
        await pluginsCall("afterLoad");
    };
    const watcher = createWatch({
        glob: src,
        listener: createListenerWatcher(tree, cycle),
    });
    cycle(listSrc);
}
const createListenerWatcher = (tree, cycle) => (group) => {
    let files = [];
    const { unlink = [] } = group;
    if (group.change) {
        const change = group.change
            .map((src) => {
            if (tree.has(src)) {
                const roots = tree.getRoots(src);
                unlink.push(src, ...roots);
                return roots;
            }
            return [];
        })
            .flat();
        files.push(...change);
    }
    if (unlink) {
        unlink.forEach((src) => tree.remove(src));
    }
    if (group.add) {
        files.push(...group.add);
    }
    if (files.length) {
        cycle(files);
    }
};

exports.createBuild = createBuild;
