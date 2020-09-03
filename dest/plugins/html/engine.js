import { Liquid } from "liquidjs";
import createCache from "@uppercod/cache";
export function createEngine() {
    var cache = createCache();
    var engine = new Liquid({
        cache: true,
        dynamicPartials: false
    });
    var parse = function (template) { return engine.parse(template); };
    return function (template, data) {
        return engine.render(cache(parse, template), data);
    };
}
//# sourceMappingURL=engine.js.map