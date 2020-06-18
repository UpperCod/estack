import test from "ava";
import { getRelativeDeep, getRelativePath, normalizePath } from "../fs";

test("getRelativeDeep", (t) => {
  t.is(getRelativeDeep("/"), "./");
  t.is(getRelativeDeep("/folder"), "./");
  t.is(getRelativeDeep("/folder/"), "../../");
  t.is(getRelativeDeep("/folder/folder"), "../../");
  t.is(getRelativeDeep("/folder/folder/folder"), "../../../");
});

test("getRelativePath", (t) => {
  t.is(getRelativePath("/", "/"), "./");
  t.is(getRelativePath("/blog", "/blog/post-2"), "./blog/post-2");
  t.is(getRelativePath("/blog/", "/blog/post-2"), "../blog/post-2");
  t.is(getRelativePath("/blog/post-1", "/blog/post-2"), "../blog/post-2");
  t.is(getRelativePath("/", "/folder"), "./folder");
  t.is(getRelativePath("/cource/items/post-4", "/post-4"), "../../post-4");
});

test("normalizePath", (t) => {
  t.is(normalizePath("/"), "/");
  t.is(normalizePath("//"), "/");
  t.is(normalizePath("//every\\"), "/every/");
  t.is(normalizePath("\\every\\any"), "/every/any");
});
