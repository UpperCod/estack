import { Files, File, Build } from "@estack/core";

export async function load(build: Build, listSrc: string[], isRoot?: boolean) {
    const currentFiles: Files = listSrc.reduce((currentFiles: Files, src) => {
        const nextSrc = build.getSrc(src);
        if (!build.isAssigned(nextSrc)) {
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
                if (plugin.filter && plugin.filter(file)) {
                    file.errors = [];
                    file.assigned = true;
                    selectFiles.push(file);
                } else {
                    nextCurrentFiles[src] = file;
                }
            }
            if (selectFiles.length && plugin.load) {
                task.push(
                    (async () => {
                        await plugin.load(selectFiles, build);
                    })()
                );
            }
            return [task, currentFiles];
        },
        [[], currentFiles]
    );

    await Promise.all(task);
}
