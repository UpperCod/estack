import {
    Files,
    File,
    WatchConfig,
    FileConfig,
    ActionsBuild,
    ConfigBuild,
} from "estack/internal";
import * as path from "path";
import getHash from "@uppercod/hash";
import { createNormalizeSrc } from "./create-normalize-src";
import { normalizePath } from "../utils/utils";

export function createBuild(actions: ActionsBuild, config: ConfigBuild) {
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
            setLink: (link) => setLink(file, link),
            addChild(src: string, config: WatchConfig = {}) {
                if (!hasFile(src)) return;
                src = getSrc(src);
                file.imported.set(src, {
                    ...file.imported.get(src),
                    ...config,
                });
            },
        };
        setLink(file, src);
        files[src] = file;
        if (watch) actions.watch(file);
        if (load) await actions.load(file);
        return file;
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

    return { files, hasFile, addFile, getFile };
}
