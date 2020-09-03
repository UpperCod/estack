import * as chokidar from "chokidar";
export function createWatch({ glob, listener, delay, normalize }) {
    let currentGroup;
    const loadGroup = () => {
        if (!currentGroup) {
            currentGroup = {};
            setTimeout(() => {
                listener(currentGroup);
                currentGroup = null;
            }, delay || 200);
        }
    };
    const watcher = chokidar.watch(glob, { ignoreInitial: true });
    ["add", "change", "unlink"].map((type) => {
        watcher.on(type, (file) => {
            loadGroup();
            currentGroup[type] = currentGroup[type] || [];
            file = normalize ? normalize(file) : file;
            if (!currentGroup[type].includes(file)) {
                currentGroup[type].push(file);
            }
        });
    });
    return watcher;
}
//# sourceMappingURL=watch.js.map