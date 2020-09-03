import { Plugin } from "@estack/core";
import { isYaml, isJson } from "../../types";
import { loadData } from "./load-data";

export function pluginData(): Plugin {
    return {
        name: "data",
        filter: ({ src }) => isYaml(src) || isJson(src),
        async load(files) {
            await Promise.all(files.map(loadData));
        },
    };
}
