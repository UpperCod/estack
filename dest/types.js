export var isYaml = function (src) { return /\.y(a){0,1}ml$/.test(src); };
export var isJson = function (src) { return /\.json$/.test(src); };
export var isUrl = function (src) { return /^(http(s){0,1}:){0,1}\/\//.test(src); };
export var isHtml = function (src) { return /\.(md|html)/.test(src); };
export var isMd = function (src) { return /\.md$/.test(src); };
export var isJs = function (src) { return /\.(js|ts|jsx|tsx)$/.test(src); };
export var isCss = function (src) { return /\.(css|scss)$/.test(src); };
//# sourceMappingURL=types.js.map