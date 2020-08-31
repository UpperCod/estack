/**@type {any} */
let postcssPluginImport;

/**
 * @param {string} file
 * @param {string} css
 * @param {any[]} postcssPlugins
 */
export async function loadPostcss(file, css, postcssPlugins) {
    const [postcss, factoryPluginImport] = await Promise.all([
        import("postcss"),
        //@ts-ignore
        import("@estack/postcss-import/factory"),
    ]);

    postcssPluginImport = postcssPluginImport || factoryPluginImport(postcss);

    //@ts-ignore
    const result = await postcss([
        postcssPluginImport,
        ...postcssPlugins,
    ]).process(css, {
        from: file,
    });

    return result;
}
