import { Liquid } from "liquidjs";
import { Build } from "estack";
import createCache from "@uppercod/cache";
import { log } from "../../utils/log";
import { RenderData, RenderDataFragment, Pages, Categories } from "./types";
import tag, { Fill } from "easy-tag-for-liquidjs";
import { select, limit, order } from "./query";

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

    engine.registerFilter("asset", async function (src: string) {
        const { environments } = this.context;
        const context = environments as RenderData;
        if (context.file) {
            const childFile = build.addFile(
                build.resolveFromFile(context.file, src),
                {
                    hash: true,
                    asset: true,
                }
            );

            build.addImporter(childFile, context.file, { rewrite: false });

            childFile.load();

            return childFile.link;
        }
    });

    engine.registerFilter("t", async function (text: string) {
        const { environments } = this.context;
        const context = environments as RenderData;
        if (context.page) {
            const { langs } = build.options.site;
            if (langs && langs[text]) {
                return langs[text][context.page.lang] ?? text;
            }
        }
        return text;
    });

    engine.registerFilter(
        "select",
        (category: Categories, ...values: string[]) => select(category, values)
    );

    engine.registerFilter("limit", (items: any[], size: number) =>
        limit(items, size)
    );

    engine.registerFilter(
        "order",
        (items: any[], ...values: [string, number]) => order(items, values)
    );

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
