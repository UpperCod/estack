import { Liquid, Tokenizer, evalToken } from "liquidjs";
import { renderMarkdown, highlighted } from "./markdown";
import { getProp, normalizeLineSpace, logger } from "./utils/utils";

let cache = {};

let engine = new Liquid({
  cache: false,
  dynamicPartials: false,
});

engine.registerFilter("order", (data, by, manual = []) => {
  manual = typeof manual == "string" ? manual.split(/\s*,\s*/g) : manual;
  return data
    .map((data) => {
      let selector = getProp(data, by);
      let position = manual.length
        ? manual.indexOf(selector) >>> 0 // 4294967295
        : selector == null
        ? -1 >>> 0 // 4294967295
        : selector;
      return { data, position };
    })
    .sort((a, b) => (a.position > b.position ? 1 : -1))
    .map(({ data }) => data);
});

engine.registerFilter("group", (data, by) => {
  let groups = {};

  data.forEach((data) => {
    let value = getProp(data, by);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(data);
  });

  return Object.keys(groups)
    .sort()
    .map((prop) => ({ group: prop, items: groups[prop] }));
});

engine.registerFilter("markdown", (string) =>
  renderMarkdown(normalizeLineSpace(string))
);

engine.registerFilter("highlighted", (string, type) =>
  highlighted(normalizeLineSpace(string), type)
);

engine.registerFilter("includes", (value, list) =>
  (list || []).includes(value)
);

engine.registerFilter("find", (data, by, equal) =>
  data.find((data) => getProp(data, by) === equal)
);

engine.registerTag("fragment", {
  parse({ args }) {
    let tokenizer = new Tokenizer(args);
    this.name = tokenizer.readFileName().content;
    tokenizer.skipBlank();
    let withValue = tokenizer.readWord();
    if (withValue && withValue.content == "with") {
      tokenizer.skipBlank();
      this.value = tokenizer.readHashes();
    }
  },
  async render(scope) {
    let data = this.value
      ? await Promise.all(
          this.value.map(async (hash) => {
            return {
              prop: hash.name.content,
              value: evalToken(hash.value, scope),
            };
          })
        ).then((data) =>
          data.reduce((data, { prop, value }) => {
            data[prop] = value;
            return data;
          }, {})
        )
      : {};

    let fragment = await this.liquid.evalValue(
      `fragments[${this.name}]`,
      scope
    );

    return fragment
      ? renderHtml(fragment.content, { ...fragment, content: null, ...data })
      : "";
  },
});

export function renderHtml(code, data) {
  cache[code] = cache[code] || engine.parse(code);
  return engine.render(cache[code], data);
}
