import { Liquid } from "liquidjs";
import createCache from "@uppercod/cache";
import { RenderData, RenderDataFragment, Pages } from "./types";
import { Build } from "estack";
import tag from "easy-tag-for-liquidjs";

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
            const childFile = await build.addFile(
                build.resolveFromFile(context.file, src)
            );
            build.addImporter(childFile, context.file);
            return childFile.link;
        }
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
