export let isYaml = (file) => /\.y(a){0,1}ml$/.test(file);

export let isJson = (file) => /\.json$/.test(file);

export let isUrl = (file) => /^(http(s){0,1}:){0,1}\/\//.test(file);

export let isHtml = (file) => /\.(md|html)/.test(file);

export let isMd = (file) => /\.md$/.test(file);

export let isJs = (file) => /\.(js|ts|jsx|tsx)$/.test(file);

export let isCss = (file) => /\.css$/.test(file);

export let isFixLink = (file) => isHtml(file) || isJs(file) || isCss(file);

export let isNotFixLink = (file) => !isFixLink(file);

export let isJsonContent = (content) => /^\s*[\{[]/.test(content);
