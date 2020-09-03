var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as path from "path";
import { readFile } from "fs/promises";
import createTree from "@uppercod/imported";
import glob from "fast-glob";
import { load } from "./load";
import { pluginHtml } from "./plugins/html";
import { pluginData } from "./plugins/data";
import { pluginServer } from "./plugins/server";
import { normalizePath } from "./utils";
import { createDataDest } from "./link";
import { createWatch } from "./watch";
export function createBuild(src) {
    return __awaiter(this, void 0, void 0, function () {
        var listSrc, tree, getDest, getSrc, hasFile, getFile, isAssigned, addFile, build, pluginsCall, cycle, watcher;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, glob(src)];
                case 1:
                    listSrc = _a.sent();
                    tree = createTree();
                    getDest = createDataDest({
                        assetHashPattern: "[hash]-[name]",
                        assetsWithoutHash: /\.(html|js)/,
                        assetsDir: "assets",
                        dest: "build",
                        href: "/"
                    });
                    getSrc = function (src) { return path.normalize(src); };
                    hasFile = function (src) { return tree.has(getSrc(src)); };
                    getFile = function (src) { return tree.get(getSrc(src)); };
                    isAssigned = function (src) {
                        if (hasFile(src)) {
                            return getFile(src).assigned;
                        }
                        return false;
                    };
                    addFile = function (src, isRoot) {
                        src = getSrc(src);
                        var file = tree.get(src);
                        if (isRoot)
                            tree.add(src);
                        if (!file.setLink) {
                            Object.assign(file, __assign(__assign({}, getDest(src)), { errors: [], read: function () { return readFile(src, "utf-8"); }, join: function (src) { return path.join(file.raw.dir, src); }, addChild: function (src) {
                                    return __awaiter(this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    src = getSrc(file.join(src));
                                                    if (!!build.hasFile(src)) return [3, 2];
                                                    return [4, load(build, [src])];
                                                case 1:
                                                    _a.sent();
                                                    tree.addChild(file.src, src);
                                                    _a.label = 2;
                                                case 2: return [2, build.getFile(src)];
                                            }
                                        });
                                    });
                                },
                                setLink: function () {
                                    var args = [];
                                    for (var _i = 0; _i < arguments.length; _i++) {
                                        args[_i] = arguments[_i];
                                    }
                                    var link = normalizePath(path.join.apply(path, args));
                                    Object.assign(file, getDest(link));
                                    return file.link;
                                },
                                addError: function (message) {
                                    if (!file.errors.includes(message)) {
                                        file.errors.push(message);
                                    }
                                } }));
                        }
                        return file;
                    };
                    build = {
                        mode: "dev",
                        global: {},
                        files: tree.tree,
                        plugins: [pluginServer(), pluginHtml(), pluginData()],
                        getSrc: getSrc,
                        addFile: addFile,
                        hasFile: hasFile,
                        getFile: getFile,
                        isAssigned: isAssigned
                    };
                    pluginsCall = function (method) {
                        return Promise.all(build.plugins.map(function (plugin) {
                            return typeof plugin[method] == "function" && plugin[method](build);
                        }));
                    };
                    return [4, pluginsCall("mounted")];
                case 2:
                    _a.sent();
                    cycle = function (listSrc) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, pluginsCall("beforeLoad")];
                                case 1:
                                    _a.sent();
                                    return [4, load(build, listSrc, true)];
                                case 2:
                                    _a.sent();
                                    return [4, pluginsCall("afterLoad")];
                                case 3:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); };
                    watcher = createWatch({
                        glob: src,
                        listener: function (group) {
                            if (group.change) {
                            }
                        }
                    });
                    cycle(listSrc);
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=build.js.map