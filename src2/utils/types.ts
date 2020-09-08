/**
 * Determines if the src has the extensions .yaml and .yml
 */
export let isYaml = (src: string) => /\.y(a){0,1}ml$/.test(src);
/**
 * Determine if the src has the extension .json
 * @param {string} src
 */
export let isJson = (src: string) => /\.json$/.test(src);
/**
 * Determine if the src starts as url
 * @param {string} src
 */
export let isUrl = (src: string) => /^(http(s){0,1}:){0,1}\/\//.test(src);
/**
 * Determines if the src has the extensions .md and .html
 */
export let isHtml = (src: string) => /\.(md|html)/.test(src);
/**
 * Determine if the src has the extension .md
 */
export let isMd = (src: string) => /\.md$/.test(src);
/**
 * Determines if the src has the extensions .js, .ts, .jsx, .tsx
 */
export let isJs = (src: string) =>
    /\.(js|ts|jsx|tsx|riot|svelte|vue)$/.test(src);
/**
 * Determine if the src has the extension .css
 */
export let isCss = (src: string) => /\.(css|scss)$/.test(src);
