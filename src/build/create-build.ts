import * as path from "path";
import getHash from "@uppercod/hash";
import * as fs from "fs/promises";
import { Files, File, WatchConfig, FileConfig, Build } from "estack";
import { ActionsBuild, ConfigBuild } from "./types";
import { createNormalizeSrc } from "./create-normalize-src";
import { normalizePath } from "../utils/utils";

export function createBuild(actions: ActionsBuild, config: ConfigBuild): Build {
    const files: Files = {};
    const getSrc = createNormalizeSrc(files);
    const getFile = (src: string) => files[getSrc(src)];
    const hasFile = (src: string): boolean => !!files[getSrc(src)];
    const addFile = async (
        src: string,
        {
            watch = true,
            write = true,
            load = true,
            hash = false,
            assigned = false,
        }: FileConfig = {}
    ): Promise<File> => {
        if (hasFile(src)) return getFile(src);
        src = getSrc(src);
        const parts = path.parse(src);
        const type = parts.ext.slice(1);
        const file: File = {
            src,
            hash,
            watch,
            write,
            parts,
            type: config.types[type] || type,
            assigned,
            imported: new Map(),
        };
        setLink(file, src);
        files[src] = file;
        if (watch) actions.watch(file);
        if (load) await actions.load(file);
        return file;
    };

    const resolveFromFile = (file: File, src: string) =>
        path.join(file.parts.dir, src);

    const addChild = (
        file: File,
        childFile: File,
        config: WatchConfig = {}
    ) => {
        file.imported.set(file.src, {
            ...file.imported.get(childFile.src),
            ...config,
        });
    };

    const readFile = async (file: File): Promise<string> => {
        if (file.content) return file.content;
        return fs.readFile(file.src, "utf8");
    };

    const setLink = (file: File, link: string) => {
        const folder = file.hash ? config.assets : "";
        const base =
            file.src == link
                ? (file.hash ? getHash(file.src) : file.parts.name) +
                  "." +
                  file.type
                : link;
        const dest = normalizePath(config.href + folder + base);
        file.dest = dest;
        file.link = dest
            .replace(/\/(index\.html)$/, "/")
            .replace(/\.html$/, "");
    };

    return {
        files,
        hasFile,
        addFile,
        getFile,
        setLink,
        addChild,
        readFile,
        resolveFromFile,
    };
}
