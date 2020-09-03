import { Liquid } from "liquidjs";
import createCache from "@uppercod/cache";
export function createEngine() {
    const cache = createCache();
    const engine = new Liquid({
        cache: true,
        dynamicPartials: false,
    });
    const parse = (template) => engine.parse(template);
    return (template, data) => engine.render(cache(parse, template), data);
}
//# sourceMappingURL=engine.js.map