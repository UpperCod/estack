import test from "ava";
import { getRelativeDeep } from "../fs";

test("getRelativeDeep", (t) => {
  t.is(getRelativeDeep("/"), "./");
  t.is(getRelativeDeep("/folder"), "./");
  t.is(getRelativeDeep("/folder/"), "../../");
  t.is(getRelativeDeep("/folder/folder"), "../../");
  t.is(getRelativeDeep("/folder/folder/folder"), "../../../");
});
