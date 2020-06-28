import glob from "fast-glob";
import path from "path";
import rollup from "rollup";
import builtins from "builtin-modules";
import {
    isJs,
    isMd,
    isUrl,
    isCss,
    isYaml,
    isHtml,
    isFixLink,
    isNotFixLink,
    isJsonContent,
    readFile,
    asyncFs,
    copyFile,
    writeFile,
    yamlParse,
    normalizePath,
    getPackage,
    request,
    queryPages,
    getMetaPage,
    logger,
    npmRun,
} from "./utils/utils";
import { createServer } from "./create-server";
import { rollupPlugins } from "./rollup/config-plugins";
import { readCss } from "./read-css";
import { createRenderHtml } from "./template";
import { renderMarkdown } from "./markdown";
import { watch } from "./watch";
import {
    MARK_ROOT,
    MARK_ROLLLUP,
    ERROR_TRANSFORMING,
    DATA_FRAGMENTS,
    DATA_PAGE,
    DATA_LAYOUT,
    FROM_LAYOUT,
} from "./constants";

/**
 *
 * @param {Object} data -
 * @param {{prop:string,value:*}} mapProp -
 */
let mapPropToObject = (data, { prop, value }) => {
    data[prop] = value;
    return data;
};

export async function createBuild(options) {
    let server;

    let rollupWatchers = [];
    // cache de rollup
    let rollupCache;

    let renderHtml = createRenderHtml({});

    /**
     * @callback fileWatcher
     * @param {string} file - child file, any changes will escalate to the parent.
     * @param {string} parentFile - parent file
     * @param {boolean} rebuild - if true, any change will force the rebuild of the parentFile
     */

    /**@type {fileWatcher} */
    let fileWatcher;

    // stores the status of processed files
    let inputs = {};

    let resolveFetchCache = {};

    // format options
    options = await formatOptions(options);

    // get list based on input expression
    let files = await glob(options.src);

    //
    let logLoadComplete = logger.load();

    let getLink = (path) => normalizePath(options.href + path);

    /**
     * returns the write destination of the file
     * @param {string} file - file name
     * @param {string} [folder] - If defined, add the folder to the destination
     */
    let getDest = (file, folder = "") =>
        normalizePath(path.join(options.dest, folder, file));

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

    let debugRoot = (message) => logger.debug(message, MARK_ROOT);
    let debugRollup = (message) => logger.debug(message, MARK_ROLLLUP);
    let footerLog = logger.footer("");

    async function markBuild(mark) {
        if (options.runAfterBuild) logger.mark(options.runAfterBuild);
        await logger.markBuild(mark);
        if (options.runAfterBuild) {
            try {
                await npmRun(options.runAfterBuild, footerLog);
                logger.markBuild(options.runAfterBuild);
            } catch (e) {
                logger.markBuildError(options.runAfterBuild, footerLog);
            }
        }
    }

    function deleteInput(file) {
        delete inputs[file];
        return file;
    }

    /**
     * gets the file name based on its type
     * @param {string} file
     */
    function getFileName(file) {
        let { name, ext } = path.parse(file);

        return normalizePath(
            isFixLink(ext)
                ? name + (isJs(ext) ? ".js" : isMd(ext) ? ".html" : ext)
                : file
                      .split("")
                      .reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
                      "-" +
                      name +
                      ext
        );
    }
    /**
     * prevents the file from working more than once
     * @param {string} file
     */
    function prevenLoad(file) {
        if (file in inputs) {
            return false;
        } else {
            return (inputs[file] = true);
        }
    }

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

        logger.header(`Server running on http://localhost:${server.port}`);
    }

    logLoadComplete();

    function mountFile({ dest, code, type, stream }) {
        if (options.virtual) {
            server.sources[dest] = { code, stream, type, stream };
        } else {
            return writeFile(dest, code);
        }
    }

    /**
     * initialize the processing queue on related files
     * @param {string[]} files - list of files to process
     * @param {*} forceBuild
     */
    async function load(files, forceBuildRollup) {
        // reset build start time
        logger.mark(MARK_ROOT);

        files = files.map(path.normalize);
        // html files are added to this list to check if a rebuild of html files is necessary
        let rebuildHtml = [];
        // prevents a second check if the file is added again from the html
        let localResolveFile = {};

        let localResolveData = {};

        /**
         * First the html files will be obtained
         * to extract the assets from these,
         * assets will be grouped in the variable nestedFiles
         */
        await Promise.all(
            files
                .filter(isHtml)
                .filter(prevenLoad)
                .map(async (file) => {
                    rebuildHtml.push(file); // this will rebuild all the html files

                    let { dir, name } = path.parse(file);

                    let html = await readFile(file);

                    let meta = [html, {}];

                    try {
                        meta = getMetaPage(html);
                    } catch (e) {
                        debugRoot(
                            `${ERROR_TRANSFORMING} ${file}:${e.mark.line}:${e.mark.position}`
                        );
                    }

                    let [content, data] = meta;

                    if (!options.watch && meta.draft) {
                        deleteInput(file);
                        return [];
                    }

                    name = data.name || name;

                    let fileName = name + ".html";

                    let dest = getDest(fileName, data.folder);

                    let link = getLink(
                        path.join(
                            data.folder || "",
                            name == "index" ? "/" : name
                        )
                    );

                    let fetch = {};

                    let assets = {};

                    if (isMd(file)) {
                        content = renderMarkdown(content);
                    }

                    function addFile(childFile) {
                        if (isUrl(childFile)) return childFile;

                        let findFile = path.join(dir, childFile);
                        /**
                         * to optimize the process, the promise that the file looks for is
                         * cached, in order to reduce this process to only one execution between buils
                         */

                        async function resolveFile(file, findFile) {
                            try {
                                await asyncFs.stat(findFile);
                                files.push(findFile);
                                fileWatcher && fileWatcher(findFile, file);
                                return {
                                    file: findFile,
                                    src: getLink(getFileName(findFile)),
                                };
                            } catch (e) {
                                return { src: childFile };
                            }
                        }

                        localResolveFile[findFile] =
                            localResolveFile[findFile] ||
                            resolveFile(file, findFile);

                        return localResolveFile[findFile];
                    }

                    async function addDataFetch(prop, value, unregister) {
                        try {
                            if (isUrl(value)) {
                                resolveFetchCache[value] =
                                    resolveFetchCache[value] || request(value);
                                value = await resolveFetchCache[value];
                            } else {
                                async function resolveFileContent(
                                    file,
                                    findFile,
                                    value
                                ) {
                                    /**
                                     * If the file is local, an observer relationship will be added,
                                     * this allows relating the data obtained from the external document
                                     * to the template and synchronizing the changes
                                     */

                                    fileWatcher &&
                                        fileWatcher(findFile, file, true);
                                    try {
                                        value = await readFile(findFile);

                                        return isYaml(findFile)
                                            ? yamlParse(value)
                                            : isJsonContent(value)
                                            ? JSON.parse(value)
                                            : value;
                                    } catch (e) {}
                                    return {};
                                }
                                value = await (localResolveData[value] =
                                    localResolveData[value] ||
                                    resolveFileContent(
                                        file,
                                        path.join(dir, value),
                                        value
                                    ));
                            }
                        } catch (e) {
                            debugRoot(`FetchError: ${file} : src=${value}`);
                        }

                        return unregister ? value : (fetch[prop] = value);
                    }

                    async function addDataAsset(prop, value) {
                        value = (await addFile(value)).src;
                        assets[prop] = value;
                    }

                    /**
                     * The following process allows the allocation of aliases for each file to process
                     */
                    let resolveDataAssets = () =>
                        data.assets
                            ? Object.keys(data.assets).map((prop) =>
                                  addDataAsset(prop, data.assets[prop])
                              )
                            : [];

                    let resolveDataFetch = () =>
                        data.fetch
                            ? Object.keys(data.fetch).map((prop) =>
                                  addDataFetch(prop, data.fetch[prop])
                              )
                            : [];

                    // These processes can be solved in parallel
                    await Promise.all([
                        ...resolveDataAssets(),
                        ...resolveDataFetch(),
                    ]);
                    inputs[file] = {
                        data: {
                            content,
                            ...data,
                            fetch,
                            assets,
                            file: normalizePath(file),
                            link,
                        },
                        name,
                        fileName,
                        dest,
                        addFile,
                        addDataAsset,
                        addDataFetch,
                    };
                })
        );

        let resolveHtmlFiles = [];

        if (rebuildHtml.length) {
            //The templates files are virtual, these can be referred
            //by a file that declares layour for use of this
            let templates = {};

            let fragments = {};
            //The files are virtual and it allows to generate a query
            //on the pages in order to create page collections
            let archives = [];
            // stores the content of the pages already resolved
            let resolvedPages = {};

            // The following processes separate the files according to their use
            let pages = Object.keys(inputs)
                .filter(isHtml)
                .map((file) => {
                    let page = inputs[file];
                    let { data } = page;
                    if (data.fragment) {
                        fragments[data.fragment] = data;
                        return;
                    } else if (data.template) {
                        templates[data.template] = page;
                        return;
                    } else if (data.archive) {
                        archives.push(page);
                        return;
                    }
                    return page;
                })
                .filter((value) => value);

            let pagesData = pages.map(({ data }) => ({
                ...data,
                get content() {
                    return resolvedPages[data.file];
                },
            }));

            pages = [
                ...pages,
                ...archives
                    .map((page) => {
                        let { data } = page;
                        // The pages grouped according to where.limit are obtained.
                        let collection = queryPages(pagesData, data.archive);

                        let folderLink = data.link.replace(options.href, "/");

                        let length = collection.length;

                        return collection.map((pages, paged) => {
                            // Create the pages manually, they are the configuration
                            let name = paged ? "/" + paged : "";

                            let fileName = paged
                                ? folderLink + name
                                : folderLink;

                            let dest = getDest(fileName + ".html");

                            let link = getLink(fileName);

                            let position = paged - 1;

                            let prev = collection[position]
                                ? folderLink + (position ? "/" + position : "")
                                : "";

                            position = paged + 1;

                            let next = collection[position]
                                ? folderLink + (position ? "/" + position : "")
                                : "";

                            // A new page is returned
                            return {
                                ...page,
                                data: {
                                    ...data,
                                    link,
                                    archive: {
                                        paged,
                                        pages,
                                        next,
                                        prev,
                                        length,
                                    },
                                },
                                name: fileName,
                                dest,
                            };
                        });
                    })
                    .flat(),
            ];

            /**
             * First resolve the pages independently,
             * this allows each page to interact with
             * its scope page before associating the
             * nested render on the layout
             */
            resolveHtmlFiles = pages.map(async (page) => {
                let { data } = page;
                let { query, content } = data;
                let layout =
                    templates[data.layout == null ? "default" : data.layout];

                if (query) {
                    query = Object.keys(query)
                        .map((prop) => ({
                            prop,
                            value: queryPages(pagesData, query[prop], true),
                        }))
                        .reduce(mapPropToObject, {});
                }

                let pageScope = {
                    pkg: options.pkg,
                    build: !options.watch,
                    page: { ...data, query },
                    layout: layout && layout.data,
                    pages: pagesData,
                    // The following properties can only be accessed
                    // from the scope of the stack and are for internal use
                    [DATA_FRAGMENTS]: fragments,
                    [DATA_LAYOUT]: layout,
                    [DATA_PAGE]: page,
                };

                try {
                    content = resolvedPages[data.file] = await renderHtml(
                        content,
                        pageScope
                    );
                    pageScope.page.content = content;
                    return pageScope;
                } catch (e) {
                    debugRoot(`${ERROR_TRANSFORMING} : ${data.file}`);
                }
            });

            /**
             * expect all page renders to be resolved, before hierarchical
             * template construction, this is to access all the content
             * associated with the previous render
             */
            await Promise.all(resolveHtmlFiles).then((pages) =>
                Promise.all(
                    /**
                     * Write the files once all have generated render of their
                     * individual content, this in order to create pages that
                     * group the content of other pages already processed
                     */
                    pages.map(async (pageScope) => {
                        if (!pageScope) return;

                        let {
                            page,
                            layout,
                            [DATA_PAGE]: _page,
                            [DATA_LAYOUT]: _layout,
                        } = pageScope;

                        let { content } = page;

                        pageScope[FROM_LAYOUT] = true;

                        if (layout) {
                            /**
                             * If the layout used by the page has the singlePage configuration,
                             * it will only generate the page that this property of fine based on its name
                             * @example
                             * singlePage : index
                             */
                            if (
                                layout.singlePage &&
                                layout.singlePage !== data.link
                            ) {
                                return;
                            }
                            try {
                                content = await renderHtml(
                                    layout.content,
                                    pageScope
                                );
                            } catch (e) {
                                debugRoot(
                                    `${ERROR_TRANSFORMING} : ${_layout.data.file}`
                                );
                            }
                        }

                        if (content != null) {
                            return mountFile({
                                dest: _page.dest,
                                code: content,
                                type: "html",
                            });
                        }
                    })
                )
            );
        }

        let resolveCssFiles = files
            .filter(isCss)
            .filter(prevenLoad)
            .map(async (file) => {
                let css = await readFile(file);
                let code = await readCss({
                    code: css,
                    file,
                    addWatchFile(childFile) {
                        if (options.watch) {
                            fileWatcher && fileWatcher(childFile, file, true);
                        }
                    },
                });
                return mountFile({
                    dest: getDest(getFileName(file)),
                    code,
                    type: "css",
                });
            });

        // parallel queue of asynchronous processes
        await Promise.all([
            ...resolveCssFiles,
            ...files // copy of static files
                .filter(isNotFixLink)
                .filter(prevenLoad)
                .map(async (file) => {
                    let dest = getDest(getFileName(file));
                    if (options.virtual) {
                        mountFile({ dest, stream: file });
                    } else {
                        return copyFile(file, dest);
                    }
                }),
            ...(files.filter(isJs).filter(prevenLoad).length || forceBuildRollup
                ? [resolveFilesJs()]
                : []),
        ]);

        //logger.markBuild(MARK_ROOT);
        await markBuild(MARK_ROOT);

        server && server.reload();
    }
    /**
     * Scope of the rollup process running in parallel to the EStack process
     */
    async function resolveFilesJs() {
        let countBuild = 0; // Ignore the first build since it synchronizes the reload from root
        // clean the old watcher
        rollupWatchers.filter((watcher) => watcher.close());
        rollupWatchers = [];

        let files = Object.keys(inputs).filter(isJs).sort();

        let input = {
            input: files,
            onwarn: debugRollup,
            external: options.external,
            cache: rollupCache,
            plugins: rollupPlugins(
                options,
                options.virtual &&
                    ((source) =>
                        mountFile({
                            ...source,
                            dest: getDest(source.dest),
                        }))
            ),
        };

        if (files.length) {
            let output = {
                dir: options.dest,
                format: "es",
                sourcemap: options.sourcemap,
            };

            if (options.watch) {
                logger.mark(MARK_ROLLLUP);
            }

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
                            logger.mark(MARK_ROLLLUP);
                            break;
                        case "END":
                            await markBuild(MARK_ROLLLUP);
                            countBuild++ && server && server.reload();
                            break;
                        case "ERROR":
                            logger.markBuildError(event.error, MARK_ROLLLUP);
                            break;
                    }
                });

                rollupWatchers.push(watcher);

                if (server) return;
            } else {
                await bundle.write(output);
            }
        }
    }

    if (options.watch) {
        // map defining the cross dependencies between child and parents
        let mapSubWatch = {};

        let watcher = watch(options.src, (group) => {
            let files = [];
            let forceBuild;

            if (group.add) {
                let groupFiles = group.add
                    .filter(isFixLink)
                    .filter(isNotPreventLoad);
                files = [...files, ...groupFiles];
            }
            if (group.change) {
                let groupChange = group.change.filter((file) => !isJs(file)); // ignore js file changes

                let groupFiles = [
                    ...groupChange, // keep files that have changed in the queue
                    ...groupChange // add new files based on existing ones in the queue
                        .filter((file) => mapSubWatch[file])
                        .map((file) =>
                            Object.keys(mapSubWatch[file]).filter(
                                (subFile) => mapSubWatch[file][subFile]
                            )
                        )
                        .flat(),
                ]
                    .filter(isPreventLoad)
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

        fileWatcher = (file, parentFile, rebuild) => {
            if (!mapSubWatch[file]) {
                mapSubWatch[file] = {};
                watcher.add(file);
            }
            if (parentFile) {
                mapSubWatch[file][parentFile] = rebuild;
            }
        };
    }

    try {
        await load(files);
        return options;
    } catch (e) {
        //await logger.markBuildError(e, MARK_ROOT);
        console.log(e);
        process.exit();
    }
}

async function formatOptions({
    src = [],
    config,
    external,
    jsx,
    jsxFragment,
    runAfterBuild,
    forceWrite,
    silent,
    href = "/",
    ...ignore
}) {
    if (silent) process.env.silent = true;

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
        ...ignore,
        ...pkg[config],
        pkg,
        href,
        virtual: !forceWrite && ignore.watch && ignore.server,
        runAfterBuild: pkg.scripts[runAfterBuild] ? runAfterBuild : "",
        jsx: jsx == "react" ? "React.createElement" : jsx,
        jsxFragment: jsx == "react" ? "React.Fragment" : jsxFragment,
    };

    // normalize routes for fast-glob
    options.src = options.src.map(normalizePath);

    return options;
}
