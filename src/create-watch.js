import chokidar from "chokidar";
/**
 *
 * @param {string|string[]} glob
 * @param {(event:event)=>void} listener
 * @returns {{add:(file:string)=>void}}
 */
export function createWatch(glob, listener) {
    /**
     * @type {event}
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

/**
 * @typedef {string[]} files
 */

/**
 * @typedef {Object<string,files>} event
 */
