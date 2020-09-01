import { createBuild } from "./dest/build";

createBuild("example/src/**/*.{html,md}").then(() => {
    console.log("\nend");
});
