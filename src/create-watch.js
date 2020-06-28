import chokidar from "chokidar";

export function createWatch(glob, listener) {
    let currentGroup;

    let loadGroup = () => {
        if (!currentGroup) {
            currentGroup = {};
            setTimeout(() => {
                listener(currentGroup);
                currentGroup = false;
            }, 200);
        }
    };

    let watcher = chokidar.watch(glob, { ignoreInitial: true });

    ["add", "change", "unlink"].map((type) => {
        watcher.on(type, (file) => {
            loadGroup();
            (currentGroup[type] = currentGroup[type] || []).push(file);
        });
    });

    return watcher;
}
