import { File, Build, Plugin } from "@estack/core";
import * as path from "path";
import createTree, { Context } from "@uppercod/imported";
import * as glob from "fast-glob";
import { load } from "./load";
import { pluginHtml } from "./plugins/html";
import { pluginData } from "./plugins/data";
import { pluginServer } from "./plugins/server";
import { normalizePath } from "./utils/utils";
import { createDataDest } from "./link";
import { createWatch, Group } from "./watch";
import { isHtml } from "./utils/types";
import { readFile } from "./utils/fs";

type Cycle = (listSrc: string[]) => Promise<void>;

export async function createBuild(src: string) {
    const listSrc = await glob(src);
    const tree = createTree();

    const getDest = createDataDest({
        assetHashPattern: "[hash]-[name]",
        assetsWithoutHash: /\.(html|js)/,
        assetsDir: "assets",
        dest: "build",
        href: "/",
    });

    const getSrc = (src: string) => path.normalize(src);
    const hasFile = (src: string) => tree.has(getSrc(src));
    const getFile = (src: string): File => tree.get(getSrc(src));
    const isAssigned = (src: string) => {
        if (hasFile(src)) {
            return getFile(src).assigned;
        }
        return false;
    };
    const addFile = (src: string, isRoot?: boolean) => {
        src = getSrc(src);
        const file: File = tree.get(src);
        if (isRoot) tree.add(src);
        if (!file.setLink) {
            Object.assign(file, {
                ...getDest(src),
                errors: [],
                alerts: [],
                read: () => readFile(src),
                join: (src: string) => path.join(file.raw.dir, src),
                async addChild(src: string) {
                    src = getSrc(file.join(src));
                    const exist = build.hasFile(src);
                    tree.addChild(file.src, src);
                    if (!exist) {
                        watcher.add(src);
                        await load(build, [src]);
                    }
                    return build.getFile(src);
                },
                async addLink(src: string) {
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
                    } else {
                        const {
                            link,
                            raw: { base: linkTitle },
                        } = await file.addChild(src);
                        return { link, linkTitle };
                    }
                },
                setLink(...args: string[]): string {
                    const link = normalizePath(path.join(...args));
                    Object.assign(file, getDest(link));
                    return file.link;
                },
                addError(message: string) {
                    if (!file.errors.includes(message)) {
                        file.errors.push(message);
                    }
                },
                addAlert(message: string) {
                    if (!file.errors.includes(message)) {
                        file.errors.push(message);
                    }
                },
            } as File);
        }
        return file;
    };

    const build: Build = {
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

    const pluginsCall = (
        method: Exclude<keyof Plugin, "name" | "load" | "filter">
    ) =>
        Promise.all(
            build.plugins.map(
                (plugin) =>
                    typeof plugin[method] == "function" && plugin[method](build)
            )
        );

    await pluginsCall("mounted");

    const cycle: Cycle = async (listSrc: string[]) => {
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

const createListenerWatcher = (tree: Context, cycle: Cycle) => (
    group: Group
) => {
    let files: string[] = [];
    const { unlink = [] } = group;
    if (group.change) {
        const change = group.change
            .map((src): string[] => {
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
