import styleCss from "./style.css";

const style = document.createElement("style");

style.innerHTML = styleCss;

document.body.appendChild(style);

console.log({
    style,
    b() {
        console.log(import("./b.js"));
    },
    document,
    age: 1000,
});
