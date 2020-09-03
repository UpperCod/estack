export async function load(build, listSrc, isRoot) {
    const currentFiles = listSrc.reduce((currentFiles, src) => {
        const nextSrc = build.getSrc(src);
        if (!build.isAssigned(nextSrc)) {
            currentFiles[nextSrc] = build.addFile(nextSrc, isRoot);
        }
        return currentFiles;
    }, {});
    const [task] = build.plugins.reduce(([task, currentFiles], plugin) => {
        const selectFiles = [];
        const nextCurrentFiles = {};
        for (let src in currentFiles) {
            const file = currentFiles[src];
            if (plugin.filter && plugin.filter(file)) {
                file.errors = [];
                file.assigned = true;
                selectFiles.push(file);
            }
            else {
                nextCurrentFiles[src] = file;
            }
        }
        if (selectFiles.length && plugin.load) {
            task.push((async () => {
                await plugin.load(selectFiles, build);
            })());
        }
        return [task, currentFiles];
    }, [[], currentFiles]);
    await Promise.all(task);
}
//# sourceMappingURL=load.js.map