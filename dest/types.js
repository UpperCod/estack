export let isYaml = (src) => /\.y(a){0,1}ml$/.test(src);
export let isJson = (src) => /\.json$/.test(src);
export let isUrl = (src) => /^(http(s){0,1}:){0,1}\/\//.test(src);
export let isHtml = (src) => /\.(md|html)/.test(src);
export let isMd = (src) => /\.md$/.test(src);
export let isJs = (src) => /\.(js|ts|jsx|tsx)$/.test(src);
export let isCss = (src) => /\.(css|scss)$/.test(src);
//# sourceMappingURL=types.js.map