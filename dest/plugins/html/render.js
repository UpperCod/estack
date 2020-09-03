import { Liquid } from "liquidjs";
export function createRender() {
    var engine = new Liquid({
        cache: true,
        dynamicPartials: false
    });
    return engine;
}
//# sourceMappingURL=render.js.map