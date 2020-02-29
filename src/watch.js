import path from "path";
import chokidar from "chokidar";

function delay(ms) {
  return value => new Promise(resolve => setTimeout(resolve, ms, value));
}

export function watch(glob, listener) {
  let pipe;
  let watcher = chokidar
    .watch(glob)
    .on("add", file => {})
    .on("change", file => {})
    .on("unlink", file => {});

  return watcher;
}
