const path = require("path");
const chokidar = require("chokidar");

function treeFiles(glob, reducer) {
  let group;

  let subEntries = {};

  let entries = [];

  let waitingProcess;

  let loadProcess = () => {
    if (!waitingProcess) {
      group = {
        add: [],
        unlink: [],
        change: []
      };
      waitingProcess = true;
      setTimeout(() => {
        waitingProcess = false;
        for (let key in group) {
          if (group[key].length) {
            reducer({
              group,
              entries,
              addEntry,
              addSubEntry
            });
          }
        }
      }, 200);
    }
  };

  let addSubEntry = (parent, child) => {
    let file = path.join(path.parse(parent).dir, child);
    if (!subEntries[file]) {
      subEntries[file] = [];
      watcher.add(file);
    }
    if (!subEntries[file].includes(parent)) {
      subEntries[file].push(parent);
    }
  };

  let addEntry = file => {
    if (!entries.includes(file)) {
      watcher.add(file);
    }
  };

  let addToGroup = (type, value) => {
    !group[type].includes(value) && group[type].push(value);
  };

  let watcher = chokidar
    .watch(glob)
    .on("add", file => {
      if (subEntries[file]) return;
      loadProcess();
      if (!entries.includes(file)) {
        addToGroup("add", file);
        entries.push(file);
      }
    })
    .on("change", file => {
      loadProcess();
      if (subEntries[file]) {
        subEntries[file].forEach(file => addToGroup("change", file));
      }
      if (entries.includes(file)) {
        addToGroup("change", file);
      }
    })
    .on("unlink", file => {
      loadProcess();
      if (subEntries[file]) {
        subEntries[file].forEach(file => addToGroup("change", file));
      }
      if (entries.includes(file)) {
        entries = entries.filter(entry => entry != file);
        addToGroup("unlink", file);
      }
    });

  return { watch() {} };
}

treeFiles(
  "example/src/*.html",
  ({ group, entries, addEntry, addSubEntry }) => {}
).watch(entries => {});
