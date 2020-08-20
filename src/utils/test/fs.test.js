import test from "ava";
import { normalizePath } from "../fs";

test("normalizePath", (t) => {
    t.is(normalizePath("/"), "/");
    t.is(normalizePath("//"), "/");
    t.is(normalizePath("//every\\"), "/every/");
    t.is(normalizePath("\\every\\any"), "/every/any");
});
