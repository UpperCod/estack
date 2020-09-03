import { Liquid, Tokenizer, evalToken } from "liquidjs";
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

    return (template: string, data: RenderData) =>
        engine.render(cache(parse, template), data);
}
