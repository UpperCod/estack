import * as chokidar from "chokidar";
export function createWatch(_a) {
    var glob = _a.glob, listener = _a.listener, delay = _a.delay, normalize = _a.normalize;
    var currentGroup;
    var loadGroup = function () {
        if (!currentGroup) {
            currentGroup = {};
            setTimeout(function () {
                listener(currentGroup);
                currentGroup = null;
            }, delay || 200);
        }
    };
    var watcher = chokidar.watch(glob, { ignoreInitial: true });
    ["add", "change", "unlink"].map(function (type) {
        watcher.on(type, function (file) {
            loadGroup();
            (currentGroup[type] = currentGroup[type] || []).push(normalize ? normalize(file) : file);
        });
    });
    return watcher;
}
//# sourceMappingURL=watch.js.map