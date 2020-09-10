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
            root = false,
        }: FileConfig = {}
    ): Promise<File> => {
        if (hasFile(src)) return getFile(src);
        src = getSrc(src);
        const meta = path.parse(src);
        const type = meta.ext.slice(1);
        const file: File = {
            src,
            root,
            hash,
            watch,
            write,
            meta,
            errors: [],
            type: config.types[type] || type,
            assigned,
            importers: new Map(),
        };
        setLink(file, src);
        files[src] = file;
        if (watch) actions.watch(file);
        if (load) await actions.load(file);
        return file;
    };

    const resolveFromFile = (file: File, src: string) =>
        path.join(file.meta.dir, src);

    const addImporter = (
        file: File,
        fileImporter: File,
        { rewrite = true }: WatchConfig = {}
    ) => {
        file.importers.set(fileImporter.src, {
            rewrite,
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
                ? (file.hash ? getHash(file.src) : file.meta.name) +
                  "." +
                  file.type
                : link;
        const dest = normalizePath(config.href + folder + base);
        file.dest = dest;
        file.link = dest
            .replace(/\/(index\.html)$/, "/")
            .replace(/\.html$/, "");
    };

    const addError = (file: File, error: string) => {
        if (!file.errors.includes(error)) file.errors.push(error);
    };

    const removeFile = (src: string) => {
        delete files[getSrc(src)];
    };

    return {
        files,
        hasFile,
        addFile,
        getFile,
        setLink,
        addError,
        readFile,
        removeFile,
        addImporter,
        resolveFromFile,
    };
}
