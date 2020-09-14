import { watch } from "../utils/watch";
import { Build, File } from "estack";

interface MapChange {
    [src: string]: boolean;
}

export const createWatch = (build: Build) =>
    watch({
        glob: build.options.glob,
        listener({ change, unlink, add }) {
            const listSrc = add || [];
            if (change) {
                const importers: MapChange = {};
                const forceImporters: MapChange = {};
                const files = change
                    .map((src) => build.getFile(src))
                    .filter((value) => value);

                files.forEach((file) => {
                    setMapChange(build, file, importers);
                    listSrc.push(file.src);
                    forceImporters[file.src] = true;
                });
                /**
                 * Explore the imports recursively to get the src of each file related to the file paramtro
                 */
                const group = { ...importers, ...forceImporters };
                for (const src in group) {
                    if (group[src]) {
                        delete build.files[src].data;
                        delete build.files[src].content;
                        delete build.files[src].assigned;
                        if (!listSrc.includes(src)) listSrc.push(src);
                    }
                }
            }
            if (unlink) {
                unlink.forEach(build.removeFile);
            }
            if (unlink || listSrc.length) {
                build.rebuild(listSrc);
            }
        },
    });
/**
 * Explore the imports recursively to get the src of each file related to the file paramtro
 * @param build
 * @param file
 * @param importers
 */
const setMapChange = (build: Build, file: File, importers: MapChange) => {
    for (const src in file.importers) {
        const childFile = build.getFile(src);
        const { rewrite } = file.importers[src];
        const exists = src in importers;
        if (childFile) {
            importers[src] = importers[src] || rewrite;
            if (!exists) setMapChange(build, childFile, importers);
        } else {
            delete file.importers[src];
        }
    }
    return importers;
};
