import { createBuild } from "./build";

createBuild("example/src/**/*.{html,md}").then(() => {});
