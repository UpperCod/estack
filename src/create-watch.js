import chokidar from "chokidar";
/**
 *
 * @param {string[]} glob
 * @param {*} listener
 */
export function createWatch(glob, listener) {
    /**
     * @type {{[file:string]:string}}
     */
    let currentGroup;

    const loadGroup = () => {
        if (!currentGroup) {
            currentGroup = {};
            setTimeout(() => {
                listener(currentGroup);
                currentGroup = null;
            }, 200);
        }
    };

    const watcher = chokidar.watch(glob, { ignoreInitial: true });

    ["add", "change", "unlink"].map((type) => {
        watcher.on(type, (file) => {
            loadGroup();
            (currentGroup[type] = currentGroup[type] || []).push(file);
        });
    });

    return watcher;
}
