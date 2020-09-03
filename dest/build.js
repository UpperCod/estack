import * as path from "path";
import { readFile } from "fs/promises";
import createTree from "@uppercod/imported";
import glob from "fast-glob";
import { load } from "./load";
import { pluginHtml } from "./plugins/html";
import { pluginData } from "./plugins/data";
import { pluginServer } from "./plugins/server";
import { normalizePath } from "./utils";
import { createDataDest } from "./link";
import { createWatch } from "./watch";
import { isHtml } from "./types";
export async function createBuild(src) {
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
                read: () => readFile(src, "utf-8"),
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
//# sourceMappingURL=build.js.map