import style from "./b.css";

console.log(style);

console.log("sWon", {
    async load() {
        console.log(await import("./b.js"));
    },
});
