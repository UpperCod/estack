import { Liquid } from "liquidjs";
import { Build } from "estack";
import createCache from "@uppercod/cache";
import getProp from "@uppercod/get-prop";
import { log } from "../../utils/log";
import {
    RenderData,
    RenderDataFragment,
    Pages,
    PageData,
    Categories,
} from "./types";

import tag, { Fill } from "easy-tag-for-liquidjs";

export interface Engine {
    render(template: string, data: RenderData): Promise<string>;
    fragments: Pages;
}

export function createEngine(build: Build): Engine {
    const cache = createCache();

    const engine = new Liquid({
        cache: true,
        dynamicPartials: false,
    });

    const parse = (template: string) => engine.parse(template);

    engine.registerFilter("asset", async function (src) {
        const { environments } = this.context;
        const context = environments as RenderData;
        if (context.file) {
            const childFile = build.addFile(
                build.resolveFromFile(context.file, src),
                {
                    hash: true,
                }
            );
            build.addImporter(childFile, context.file, { rewrite: false });

            await childFile.load();

            return childFile.link;
        }
    });

    engine.registerFilter("query", function (
        category: Categories,
        ...data: [string, any]
    ) {
        let sort = ["date", "order"];
        let order = -1;
        let operator = "or";
        let empty: PageData[] = [];
        const items = data.reduce((items: PageData[], [type, value]) => {
            switch (type) {
                case "operator":
                    operator = value;
                    break;
                case "select":
                    if (items == empty) return category[value] ?? [];
                    let values = category[value] ?? [];
                    return operator == "or"
                        ? [
                              ...items,
                              ...values.filter((data) => !items.includes(data)),
                          ]
                        : [...items.filter((data) => values.includes(data))];
                case "limit":
                    return items.slice(0, value);
                case "sort":
                    sort = [value];
                    break;
                case "order":
                    order = value;
                    break;
            }
            return items;
        }, empty);

        const getAnyValue = (
            data: any,
            props: string[],
            optional: any
        ): any => {
            return props.find((prop) => getProp(data, prop)) ?? optional;
        };

        return items.sort((dataA: PageData, dataB: PageData) => {
            getAnyValue(dataA, sort, 0) > getAnyValue(dataB, sort, 0)
                ? order
                : order * -1;
        });
    });

    engine.registerFilter("log", function (data: Fill) {
        const { environments } = this.context;
        const context = environments as RenderData;
        if (context.file) {
            log({
                message: `[time] Render data context in [grey $]`,
                params: [context.file.src],
                raw: data,
            });
        }
        return data;
    });

    engine.registerTag(
        "fragment",
        tag({
            render(root, index, value) {
                const file = context.fragments[index];
                if (file) {
                    const { data } = file;
                    return render(data.content, {
                        page: { ...data, ...value },
                        file,
                    });
                }
                return "";
            },
        })
    );

    const render = (template: string, data: RenderData | RenderDataFragment) =>
        engine.render(cache(parse, template), data);

    const context: Engine = { render, fragments: {} };

    return context;
}
