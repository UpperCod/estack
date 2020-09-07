import { Liquid } from "liquidjs";
import createCache from "@uppercod/cache";
import { RenderData } from "./types";

interface Render {
    (template: string, data: RenderData): Promise<string>;
}

export function createEngine(): Render {
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
            const { link } = await context.file.addChild(src);
            return link;
        }
    });

    return (template: string, data: RenderData) =>
        engine.render(cache(parse, template), data);
}
