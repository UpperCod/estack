/**
 * Determines if the file has the extensions .yaml and .yml
 * @param {string} file
 */
export let isYaml = (file) => /\.y(a){0,1}ml$/.test(file);
/**
 * Determine if the file has the extension .json
 * @param {string} file
 */
export let isJson = (file) => /\.json$/.test(file);
/**
 * Determine if the file starts as url
 * @param {string} file
 */
export let isUrl = (file) => /^(http(s){0,1}:){0,1}\/\//.test(file);
/**
 * Determines if the file has the extensions .md and .html
 * @param {string} file
 */
export let isHtml = (file) => /\.(md|html)/.test(file);
/**
 * Determine if the file has the extension .md
 * @param {string} file
 */
export let isMd = (file) => /\.md$/.test(file);
/**
 * Determines if the file has the extensions .js, .ts, .jsx, .tsx
 * @param {string} file
 */
export let isJs = (file) => /\.(js|ts|jsx|tsx)$/.test(file);
/**
 * Determine if the file has the extension .css
 * @param {string} file
 */
export let isCss = (file) => /\.css$/.test(file);
/**
 * Determines if the file is of the permanent name type with extensions .html, .css, .js
 * @param {string} file
 */
export let isFixLink = (file) => isHtml(file) || isJs(file) || isCss(file);
/**
 * Determine if the file is not permanently named
 * @param {string} file
 */
export let isNotFixLink = (file) => !isFixLink(file);
/**
 * Determines if the file content can be considered json
 * @param {string} content
 */
export let isJsonContent = (content) => /^\s*[\{[]/.test(content);
