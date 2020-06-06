import { Liquid } from "liquidjs";
import { renderMarkdown } from "./markdown";
import { getProp } from "./utils";

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

engine.registerFilter("log", (data) => {
  console.log(data);
  return "";
});

engine.registerFilter("markdown", (string, clearSpace) =>
  renderMarkdown(
    clearSpace
      ? string
          .split(/\n/)
          .map((str) => str.trim())
          .join("\\n")
      : string
  )
);

engine.registerFilter("pagination", (...args) => {
  console.log(args);
  return [];
});

engine.registerFilter("attributes", (data) =>
  Object.keys(data)
    .map((prop) =>
      typeof data[prop] == "boolean"
        ? data[prop]
          ? prop
          : ""
        : `prop=${JSON.stringify(data[prop])}`
    )
    .join(" ")
);

engine.registerFilter("includes", (value, list) =>
  (list || []).includes(value)
);

engine.registerFilter("find", (data, by, equal) =>
  data.find((data) => getProp(data, by) === equal)
);

export function renderHtml(code, data) {
  cache[code] = cache[code] || engine.parse(code);
  return engine.render(cache[code], data);
}
