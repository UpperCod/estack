import { watch } from "../utils/watch";
import { Build, File, WatchConfig } from "estack";

export const createWatch = (build: Build) =>
    watch({
        glob: build.options.glob,
        listener({ change, unlink, add }) {
            const listSrc = add || [];
            if (change) {
                const files = change
                    .map((src) => build.getFile(src))
                    .filter((value) => value);

                const importers = {};

                files.forEach((file) => {
                    getRewriteFiles(build, file, importers);
                });
                /*
                files.forEach((file) => {
                    listSrc.push(file.src);
                    file.assigned = false;
                    delete file.content;
                    getRewriteFiles(build, file, importers);
                });

                importers.forEach(({ rewrite }, file) => {
                    listSrc.push(file.src);
                    if (rewrite) {
                        file.assigned = false;
                        delete file.content;
                    }
                });
                */
            }
            if (unlink) {
                unlink.forEach(build.removeFile);
            }
            if (unlink || listSrc.length) {
                build.rebuild(listSrc);
            }
        },
    });

const getRewriteFiles = (build: Build, file: File, importers: {}) => {
    //file.importers.forEach((config, src) => {
    //    const file = build.getFile(src);
    //});
    return importers;
};
