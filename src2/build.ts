import { File, Build, Plugin } from "@estack/core";
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
                read: () => readFile(src, "utf-8"),
                join: (src: string) => path.join(file.raw.dir, src),
                async addChild(src: string) {
                    src = getSrc(file.join(src));
                    if (!build.hasFile(src)) {
                        await load(build, [src]);
                        tree.addChild(file.src, src);
                    }
                    return build.getFile(src);
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

    const cycle = async (listSrc: string[]) => {
        await pluginsCall("beforeLoad");
        await load(build, listSrc, true);
        await pluginsCall("afterLoad");
    };

    const watcher = createWatch({
        glob: src,
        listener(group) {
            if (group.change) {
            }
        },
    });

    cycle(listSrc);
}
