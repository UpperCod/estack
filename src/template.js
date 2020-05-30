import { Liquid } from "liquidjs";

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

engine.registerFilter("find", (data, by, equal) =>
  data.find((data) => getProp(data, by) === equal)
);

function getProp(value, prop, option) {
  value = value || {};
  prop = Array.isArray(prop) ? prop : prop.match(/([^\[\]\.]+)/g);
  for (let i = 0; i < prop.length; i++) {
    if (typeof value === "object" && prop[i] in value) {
      value = value[prop[i]];
    } else {
      return option;
    }
  }
  return value;
}

export function renderHtml(code, data) {
  return engine.parseAndRender(code, data);
}
