import path from "path";
import getHash from "@uppercod/hash";
import fs from "fs/promises";
import { Files, File, WatchConfig, FileConfig, Build } from "estack";
import { ActionsBuild, ConfigBuild } from "./types";
import { createNormalizeSrc } from "./create-normalize-src";
import { normalizePath } from "../utils/utils";

export function createBuild(actions: ActionsBuild, config: ConfigBuild): Build {
    const files: Files = {};
    const getSrc = createNormalizeSrc(files);

    const getFile: Build["getFile"] = (src: string) => files[getSrc(src)];

    const hasFile: Build["hasFile"] = (src: string): boolean =>
        !!files[getSrc(src)];

    const addFile: Build["addFile"] = async (
        src: string,
        {
            // Indica should be added to the watcher.
            watch = true,
            // Indicates that the file must be written to disk in build mode.
            write = true,
            // Indicates that the file can be uploaded by plugins.
            load = true,
            // Indicates that the file will be sent to load if it has just been created
            autoload = true,
            // indicates whether to generate a hash path for writing.
            hash = false,
            // Indicates that the file is sent from the build
            root = false,
            // Indicates if the file is an asset
            asset = false,
        }: FileConfig = {}
    ): Promise<File> => {
        if (hasFile(src)) {
            const file = getFile(src);
            // a file marked as load autoload and assigned will
            // be sent if it is added again for asset reassignment
            if (!file.assigned && file.autoload && file.load) {
                await actions.load(file);
            }
            return file;
        }
        src = getSrc(src);
        const meta = path.parse(src);
        const type = meta.ext.slice(1);
        const file: File = {
            src,
            root,
            hash,
            asset,
            watch,
            write,
            meta,
            load,
            errors: [],
            autoload,
            type: config.types[type] || type,
            importers: {},
        };
        setLink(file, src);
        files[src] = file;
        if (watch) actions.watch(file);
        if (autoload && load) await actions.load(file);
        return file;
    };

    const resolveFromFile: Build["resolveFromFile"] = (
        file: File,
        src: string
    ) => path.join(file.meta.dir, getSrc(src));

    const addImporter: Build["addImporter"] = (
        file: File,
        fileImporter: File,
        { rewrite = true }: WatchConfig = {}
    ) => {
        file.importers[fileImporter.src] = { rewrite };
    };

    const readFile: Build["readFile"] = async (file: File): Promise<string> => {
        if (file.content) return file.content;
        return fs.readFile(file.src, "utf8");
    };

    const setLink: Build["setLink"] = (file: File, link: string) => {
        const folder = file.hash || file.asset ? config.assets : "";
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

    const addError: Build["addError"] = (file: File, error: string) => {
        if (!file.errors.includes(error)) file.errors.push(error);
    };

    const removeFile: Build["removeFile"] = (src: string) => {
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
