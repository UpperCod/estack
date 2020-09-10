import { Liquid } from "liquidjs";
import createCache from "@uppercod/cache";
import { RenderData } from "./types";
import { Build, Files } from "estack";

export interface Engine {
    render(template: string, data: RenderData): Promise<string>;
    fragments: Files;
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
        //const context = environments as RenderData;
        //if (context.file) {
        //    const { link } = await context.file.addChild(src);
        //    return link;
        //}
    });

    // engine.registerFilter("link", async function (src) {
    //     const { environments } = this.context;
    //     const context = environments as RenderData;
    //     if (context.file) {
    //         const { link } = await context.file.addLink(src);
    //         return link;
    //     }
    // });

    const render = (template: string, data: RenderData) =>
        engine.render(cache(parse, template), data);

    const context = { render, fragments: {} };

    return context;
}
