import Handlebars from "handlebars";

Handlebars.registerHelper("toJson", (data) => JSON.stringify(data || ""));

Handlebars.registerHelper("when", function (a, logic, b) {
  let options = arguments[arguments.length - 1];
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
  } else {
    return a ? logic : b == options ? false : b;
  }
});

export function renderHtml(code, data) {
  return Handlebars.compile(code)(data);
}
