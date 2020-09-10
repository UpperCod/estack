import styleCss from "./css-in-js.css";

const style = document.createElement("style");

style.innerHTML = styleCss;

document.body.appendChild(style);

console.log(styleCss);
