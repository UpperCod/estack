import { Plugin, Build } from "estack";

export const pluginsParallel = (
    method: Exclude<keyof Plugin, "name" | "load" | "filter">,
    plugins: Plugin[],
    build: Build
) =>
    Promise.all(
        plugins.map(
            (plugin) =>
                typeof plugin[method] == "function" && plugin[method](build)
        )
    );

export const pluginsSequential = (
    method: Exclude<keyof Plugin, "name" | "load" | "filter">,
    plugins: Plugin[],
    build: Build
) =>
    plugins.reduce(
        (promise, plugin) =>
            typeof plugin[method] == "function"
                ? promise.then(() => plugin[method](build))
                : promise,
        Promise.resolve()
    );
