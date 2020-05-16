import Handlebars from "handlebars";

Handlebars.registerHelper("set", function (index, data, context) {
  let options = arguments[arguments.length - 1];
  if (context || options) {
    (options != context && context != null && typeof context == "object"
      ? context
      : options.data.root)[index] = data;
  }
  return "";
});

Handlebars.registerHelper("toJson", (data) => JSON.stringify(data || ""));

Handlebars.registerHelper("when", function (a, logic, b, options) {
  if (["===", "==", "<", ">", "!=", "!==", "<=", ">="].includes(logic)) {
    let state =
      logic == "==="
        ? a === b
        : logic == "=="
        ? a == b
        : logic == ">"
        ? a > b
        : logic == "<"
        ? a < b
        : logic == ">="
        ? a >= b
        : logic == "<="
        ? a <= b
        : logic == "!="
        ? a != b
        : logic == "!=="
        ? a !== b
        : false;
    return options.fn ? options[state ? "fn" : "inverse"](this) : state;
  }
});

Handlebars.registerHelper("query", function (data, steps, options) {
  return option.fn(
    steps.reduce((data, step) => queryTypes[step.type](data, step), data)
  );
});

let queryTypes = {
  group(data, { by }) {
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
      .map((prop) => [prop, groups[prop]]);
  },
  order(data, { by, manual }) {
    return data
      .map((data) => {
        let selector = getProp(data, by);
        let position = manual.indexOf(selector) >>> 0;
        return { data, selector, position };
      })
      .sort((a, b) => (a.position > b.position ? 1 : -1))
      .map(({ data }) => data);
  },
};

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
  return Handlebars.compile(code)(data);
}
