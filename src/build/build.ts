import { Plugin, OptionsBuild, Build, File, WatchConfig } from "estack";
import * as glob from "fast-glob";
import { Load } from "./types";
import { createBuild } from "./create-build";
import { loadOptions } from "./load-options";
import { pluginHtml } from "../plugins/html";
import { pluginsParallel, pluginsSequential } from "./plugins";
import { createWatch } from "../create-watch";
export async function build(opts: OptionsBuild) {
    const options = await loadOptions(opts);

    const listSrc = await glob(options.glob);

    const plugins: Plugin[] = [pluginHtml()];

    /**
     * Load loads files into plugins for manipulation
     */
    const load: Load = async (file) => {
        if (file.assigned) return;
        /**
         * Clean the errors to check if they have been corrected
         */
        file.errors = [];
        /**
         * Avoid reassignments to plugins from the file
         */
        file.assigned = true;
        /**
         * Plugins that manipulate types run sequentially
         */
        const pipe = plugins.filter((plugin) => plugin.filter(file));
        if (pipe.length) {
            await pipe.reduce(
                (promise, plugin) =>
                    promise.then(() => plugin.load(file, build)),
                Promise.resolve()
            );
        }
    };
    /**
     * Capture the last cycle as a promise to execute
     * tasks at the end of this
     */
    let currentCycle: Promise<void>;
    /**
     * The cycles are parallel processes sent from the build,
     * the cyclos communicate to the plugin the status of the build
     * @param src
     */
    const cycle = (src: string[]) =>
        (currentCycle = new Promise(async (resolve, reject) => {
            console.log(src);
            await pluginsSequential("buildStart", plugins, build);
            await pluginsParallel("beforeLoad", plugins, build);
            await Promise.all(
                src.map((src) => build.addFile(src, { root: true }))
            );
            await pluginsParallel("afterLoad", plugins, build);
            await pluginsSequential("buildEnd", plugins, build);
            resolve();
        }));

    const watcher = options.watch
        ? createWatch({
              glob: options.glob,
              listener({ change, unlink = [], add }) {
                  const listSrc = add || [];
                  if (change) {
                      const files = change
                          .map((src) => build.getFile(src))
                          .filter((value) => value);

                      const importers: Map<File, WatchConfig> = new Map();

                      files.forEach((file) => {
                          importers.set(file, { rewrite: true });
                          getRewriteFiles(build, file, importers);
                      });

                      importers.forEach(({ rewrite }, { src }) => {
                          if (rewrite) {
                              listSrc.push(src);
                              build.removeFile(src);
                          }
                      });
                  }
                  if (unlink) {
                      unlink.forEach(build.removeFile);
                  }
                  if (unlink || listSrc.length) {
                      cycle(listSrc);
                  }
              },
          })
        : null;

    const build = createBuild(
        /**
         * Actions are functions that allow you to
         * communicate from the build events object.
         * This object allows isolating the cyclo and
         * watch processes from the build
         */
        {
            load,
            watch: (file) => {
                if (watcher.add) watcher.add(file.src);
            },
            error: async (file) => {
                await currentCycle;
                //console.log(file.src);
                //file.errors.map((error) => console.log(error));
            },
        },
        /**
         * Config
         */
        {
            href: "/",
            assets: "assets/",
            types: {
                jsx: "js",
                ts: "js",
                tsx: "js",
                md: "html",
            },
        }
    );

    await pluginsParallel("mounted", plugins, build);

    await cycle(listSrc);
}

const getRewriteFiles = (
    build: Build,
    file: File,
    importers: Map<File, WatchConfig> = new Map()
) => {
    file.importers.forEach((config, src) => {
        const file = build.getFile(src);
        if (!file) return;
        if (!importers.has(file)) {
            importers.set(file, config);
            getRewriteFiles(build, file, importers);
        }
    });
    return importers;
};
