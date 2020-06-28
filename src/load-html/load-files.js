import path from "path";
import {
    isMd,
    request,
    isUrl,
    normalizePath,
    isYaml,
    yamlParse,
    isJsonContent,
    getMetaPage,
} from "../utils/utils";
import { renderMarkdown } from "../markdown";

import { ERROR_TRANSFORMING } from "../constants";

const resolveFetchCache = {};

function resolveRequest(value) {
    return (resolveFetchCache[value] =
        resolveFetchCache[value] || request(value));
}

export function loadFiles(build, htmlFiles) {
    let localResolveFile = {};
    let localResolveDataFile = {};

    function resolveFile(file) {
        /**
         * to optimize the process, the promise that the file looks for is
         * cached, in order to reduce this process to only one execution between buils
         */
        async function resolve(file) {
            await asyncFs.stat(file);
            return file;
        }

        localResolveFile[findFile] =
            localResolveFile[findFile] || resolve(file);

        return localResolveFile[findFile];
    }

    function resolveDataFile(findFile) {
        /**
         * If the file is local, an observer relationship will be added,
         * this allows relating the data obtained from the external document
         * to the template and synchronizing the changes
         */
        async function resolve() {
            let value = await build.open(findFile);

            return isYaml(findFile)
                ? yamlParse(value)
                : isJsonContent(value)
                ? JSON.parse(value)
                : value;
        }

        return (localResolveDataFile[findFile] =
            localResolveDataFile[findFile] || resolve(findFile));
    }

    return Promise.all(
        htmlFiles.map(async (file) => {
            let { dir, name } = path.parse(file);
            let code = await build.open(file);
            let meta = [code, {}];

            try {
                meta = getMetaPage(code);
            } catch (e) {
                build.debugRoot(
                    `${ERROR_TRANSFORMING} ${file}:${e.mark.line}:${e.mark.position}`
                );
            }

            let [content, data] = meta;

            if (!build.options.watch && meta.draft) {
                build.deleteInput(file);
                return [];
            }

            name = data.name || name;

            let fileName = name + ".html";

            let dest = build.getDest(fileName, data.folder);

            let link = build.getLink(
                path.join(data.folder || "", name == "index" ? "/" : name)
            );

            let fetch = {};

            let assets = {};

            let nextAssets = [];

            if (isMd(file)) {
                content = renderMarkdown(content);
            }

            let joinChildFile = (file) => path.join(dir, file);

            async function addFile(src) {
                if (isUrl(src)) return src;
                let childFile = joinChildFile(src);
                try {
                    childFile = await resolveFile(childFile);
                    build.fileWatcher(childFile, file);
                    nextAssets.push(childFile);
                    return childFile;
                } catch (e) {
                    /**@todo error por no existir el archivo */
                }
            }

            async function addDataAsset(prop, src) {
                assets[prop] = await addFile(src);
            }

            async function addDataFetch(prop, src, unregister) {
                try {
                    if (isUrl(src)) {
                        src = await resolveRequest(src);
                    } else {
                        let childFile = joinChildFile(src);

                        build.fileWatcher(childFile, file, true);

                        src = await resolveDataFile(childFile);
                    }
                } catch (e) {
                    build.debugRoot(`FetchError: ${file} : src=${src}`);
                }
                return unregister ? src : (fetch[prop] = src);
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
            await Promise.all([...resolveDataAssets(), ...resolveDataFetch()]);

            build.inputs[file] = {
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

            return nextAssets;
        })
    ).then((files) => files.flat());
}
