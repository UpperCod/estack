import chokidar from "chokidar";

export function watch(glob, listener) {
  let currentGroup;

  const loadGroup = () => {
    if (!currentGroup) {
      currentGroup = {};
      setTimeout(() => {
        listener(currentGroup);
        currentGroup = false;
      }, 200);
    }
  };

  const watcher = chokidar.watch(glob);

  ["add", "change", "unlink"].map(type => {
    watcher.on(type, file => {
      loadGroup();
      (currentGroup[type] = currentGroup[type] || []).push(file);
    });
  });

  return watcher;
}
