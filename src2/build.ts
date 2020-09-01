import { File, Build } from "@estack/core";
import * as path from "path";
import { readFile } from "fs/promises";
import createTree from "@uppercod/imported";
import glob from "fast-glob";
import { load } from "./load";
import { pluginHtml } from "./plugins/html";
import { pluginData } from "./plugins/data";
import { normalizePath } from "./utils";

export async function createBuild(src: string) {
    const listSrc = await glob(src);
    const tree = createTree();
    const getSrc = (src: string) => path.normalize(src);
    const hasFile = (src: string) => tree.has(getSrc(src));
    const getFile = (src: string) => tree.get(getSrc(src));
    const addFile = (src: string) => {
        src = getSrc(src);
        const file: File = tree.get(src);
        const dataSrc = path.parse(src);
        Object.assign(file, {
            ...dataSrc,
            read: () => readFile(src, "utf-8"),
            join(src: string) {
                return path.join(dataSrc.dir, src);
            },
            async addChild(src: string) {
                src = getSrc(src);
                if (!build.hasFile(src)) {
                    await load(build, [src]);
                }
                return build.getFile(src);
            },
            setLink(...args: string[]): string {
                return (file.link = normalizePath(path.join(...args)));
            },
        });
        return file;
    };
    const build: Build = {
        files: tree.tree,
        plugins: [pluginHtml(), pluginData()],
        getSrc,
        addFile,
        hasFile,
        getFile,
    };
    await load(build, listSrc);
}
