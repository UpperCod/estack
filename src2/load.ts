import { Files, File, Build } from "@estack/core";

export async function load(build: Build, listSrc: string[]) {
    const currentFiles: Files = listSrc.reduce((currentFiles: Files, src) => {
        const nextSrc = build.getSrc(src);
        if (!build.hasFile(nextSrc)) {
            currentFiles[nextSrc] = build.addFile(nextSrc);
        }
        return currentFiles;
    }, {});

    const [task] = build.plugins.reduce(
        ([task, currentFiles], plugin) => {
            const selectFiles: File[] = [];
            const nextCurrentFiles: Files = {};
            for (let src in currentFiles) {
                const file: File = currentFiles[src];
                if (plugin.filter(file)) {
                    selectFiles.push(file);
                } else {
                    nextCurrentFiles[src] = file;
                }
            }
            if (selectFiles.length) {
                task.push(
                    (async () => {
                        selectFiles.forEach((file) => (file.prevent = true));
                        await plugin.load(selectFiles, build.files);
                    })()
                );
            }
            return [task, currentFiles];
        },
        [[], currentFiles]
    );

    await Promise.all(task);
}
