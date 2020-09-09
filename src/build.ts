import { File, Options, Build, LogBody, FileOptions } from "estack";
import * as path from "path";
import * as glob from "fast-glob";
import createTree, { Context } from "@uppercod/imported";
import { load } from "./load";
import { createDataDest } from "./link";
import { createWatch, Group } from "./watch";
import { createMarks } from "./utils/mark";
import { createLog } from "./log";
import { loadOptions } from "./options";
import { pluginHtml } from "./plugins/html";
import { pluginData } from "./plugins/data";
import { pluginServer } from "./plugins/server";
import { pluginJs } from "./plugins/js";
import { pluginCss } from "./plugins/css";
import { pluginWrite } from "./plugins/write";
import { createSetFile } from "./build/file";
import { pluginsParallel, pluginsSequential } from "./plugins";
type Cycle = (listSrc: string[]) => Promise<void>;

export async function createBuild(opts: Options) {
    const options = await loadOptions(opts);
    const listSrc = await glob(options.src);
    const cwd = process.cwd();
    const tree = createTree({
        format: (string) => path.relative(cwd, string),
    });

    const log = createLog({
        build: "Built in [bold.green $], Found [bold.red $] errors.",
        footer: options.watch ? "\nWatching for file changes...\n" : "",
    });

    const mark = createMarks();

    const getDest = createDataDest(options);

    const hasFile = (src: string) => tree.has(src);
    const getFile = (src: string): File => tree.get(src);
    const isAssigned = (src: string) => {
        if (hasFile(src)) {
            return getFile(src).assigned;
        }
        return false;
    };
    const addFile = (
        src: string,
        {
            root = false,
            watch = true,
            hash = true,
            write = true,
            assigned,
        }: FileOptions = {}
    ) => {
        const file: File = tree.get(src);
        file.watch = file.watch ?? watch;
        file.write = file.write ?? write;
        file.root = file.root ?? root;
        file.hash = file.hash ?? hash;
        file.assigned = file.assigned ?? assigned;

        if (watch) watcher.add(file.src);

        setFile(file, (file) => load(build, [file.src]));

        return file;
    };
    /**
     * Private context mutates the file to define the utilities of this
     */
    const setFile = createSetFile({ addFile, getFile, getDest }, tree);

    const cycle: Cycle = async (listSrc: string[]) => {
        const closeMark = mark("build");

        await pluginsSequential("buildStart", build.plugins, build);
        await pluginsParallel("beforeLoad", build.plugins, build);
        await load(build, listSrc, true);
        await pluginsParallel("afterLoad", build.plugins, build);
        await pluginsSequential("buildEnd", build.plugins, build);

        buildLog(closeMark());
    };

    const build: Build = {
        log,
        mode: "dev",
        global: {},
        files: tree.tree,
        plugins: [
            pluginHtml(),
            pluginData(),
            pluginCss(),
            pluginJs(),
            options.server ? pluginServer() : pluginWrite(),
        ].filter((plugin) => plugin),
        addFile,
        hasFile,
        getFile,
        getDest,
        isAssigned,
        options,
        cycle,
    };

    await pluginsParallel("mounted", build.plugins, build);

    const buildLog = (time: string) => {
        const errors: LogBody[] = [];
        const alerts: LogBody[] = [];

        for (const src in build.files) {
            const file = build.files[src];

            file.errors.length &&
                errors.push({
                    src: file.src,
                    items: file.errors,
                });

            file.alerts.length &&
                alerts.push({
                    src: file.src,
                    items: file.errors,
                });
        }

        alerts.length &&
            log.print({
                type: "alert",
                message: "",
                body: alerts,
            });

        log.print({
            type: "error",
            message: "build",
            params: [time, errors.length + ""],
            body: errors,
        });

        log.print({
            type: "raw",
            message: "footer",
        });
    };

    const watcher =
        options.watch &&
        createWatch({
            glob: options.src,
            listener: createListenerWatcher(tree, cycle),
        });

    await cycle(listSrc);
}

const createListenerWatcher = (tree: Context, cycle: Cycle) => (
    group: Group
) => {
    let files: string[] = [];
    const { unlink = [] } = group;
    if (group.change) {
        const change = group.change
            .map((src): string[] => {
                if (tree.has(src)) {
                    const file: File = tree.get(src);
                    if (file.watch) {
                        const roots = tree.getRoots(src);
                        unlink.push(file.src);
                        return roots;
                    }
                }
                return [];
            })
            .flat();

        files.push(...change);
    }
    if (unlink) {
        unlink.forEach((src) => tree.remove(src));
    }

    if (group.add) {
        files.push(...group.add);
    }

    if (files.length) {
        cycle(files);
    }
};
