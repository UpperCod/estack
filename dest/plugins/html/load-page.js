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
import { frontmatter } from "./frontmatter";
import createCache from "@uppercod/cache";
import { loadData } from "../data/load-data";
import { normalizePath } from "../../utils";
var cache = createCache();
export function loadFile(rootFile) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, html, metadata, _b, _c, copyRootFile, data, _d, link, _e, folder, permalink, slug, _content, content, name;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _b = frontmatter;
                    _c = [rootFile.src];
                    return [4, rootFile.read()];
                case 1:
                    _a = _b.apply(void 0, _c.concat([_f.sent()])), html = _a[0], metadata = _a[1];
                    copyRootFile = __assign({}, rootFile);
                    copyRootFile.read = function () { return Promise.resolve(metadata); };
                    return [4, loadData(copyRootFile)];
                case 2:
                    data = _f.sent();
                    _d = data.link, link = _d === void 0 ? "" : _d, _e = data.folder, folder = _e === void 0 ? "" : _e, permalink = data.permalink, slug = data.slug, _content = data.content;
                    content = _content || html;
                    name = slug || rootFile.name;
                    link = link || permalink;
                    if (link) {
                        rootFile.setLink((link += /\/$/.test(link) || link == "/" ? "index.html" : ".html"));
                    }
                    else {
                        rootFile.setLink(folder, name + ".html");
                    }
                    rootFile.data = __assign(__assign({}, data), { content: content, link: rootFile.link, slug: normalizePath(name), file: normalizePath(rootFile.src) });
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=load-page.js.map