import { watch } from "../utils/watch";
import { Build, File, WatchConfig } from "estack";

export const createWatch = (build: Build) =>
    watch({
        glob: build.options.glob,
        listener({ change, unlink = [], add }) {
            const listSrc = add || [];
            if (change) {
                const files = change
                    .map((src) => build.getFile(src))
                    .filter((value) => value);

                const importers: Map<File, WatchConfig> = new Map();

                files.forEach((file) => {
                    importers.set(file, { rewrite: true });
                    getRewriteFiles(build, file, importers);
                });

                importers.forEach(({ rewrite }, { src }) => {
                    listSrc.push(src);
                    if (rewrite) {
                        build.removeFile(src);
                    }
                });
            }
            if (unlink) {
                unlink.forEach(build.removeFile);
            }
            if (unlink || listSrc.length) {
                build.rebuild(listSrc);
            }
        },
    });

const getRewriteFiles = (
    build: Build,
    file: File,
    importers: Map<File, WatchConfig> = new Map()
) => {
    file.importers.forEach((config, src) => {
        const file = build.getFile(src);
        if (!file) return;
        if (!importers.has(file)) {
            importers.set(file, config);
            getRewriteFiles(build, file, importers);
        }
    });
    return importers;
};
