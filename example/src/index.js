import { h } from "atomico";

console.log({
  node: document.querySelector("*"),
  d: h,
  data: import("//localhost:8080/header.js")
});
