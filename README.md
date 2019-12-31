## bundle-cli

![bundle-cli](https://res.cloudinary.com/dz0i8dmpt/image/upload/v1577805935/github/bundle-cli/carbon_14_1.png)

This CLI was created with the intention of simplifying the creation of projects based on webcomponents, bundle-cli tries to solve the following objectives:

1.  Export from html files,this is achieved by [parse5](https://www.npmjs.com/package/parse5) to search within the html the selector `script[type="module"][src="*"]`
2.  Individual or multiple export by means of expressions, eg `bundle src/components/*-*.js my-dist --external`, this is solved by using [fast-glob](https://www.npmjs.com/package/fast-glob).
3.  exportacion usando el CDN unpkg, This is solved by applying a resolution algorithm based on [resolve](https://www.npmjs.com/package/resolve), to search for the file associated with the module, avoiding the redirection of unpkg by resolution.
4.  Agile webcomponents development experience through the use of a server and liveload, this is solved by a bundle-cli server, which dispatches updates only by observing the directories and files selected by the expiration.
5.  Support Typescript, support is based on [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript).
6.  read the css as plain text to insert the webcomponent, this is achieved by [postcss+preset-env](https://postcss.org/), additionally bundle-cli observes the internal imports of the css to correctly dispatch updates when using the flat `--server --watch`.
7.  Automatically generate import maps, this is achieved through the same unpkg resolution process, so the dependencies are linked to that CDN.
8.  Extending the babel configuration, internally bundle-cli uses babel, this configuration can be extended by declaring in package.json[babel] presets or plugins, bundle-cli for an intelligent merge of the configurations to avoid conflicts.

Bundle cli works thanks to the power of [Rollup](https://rollupjs.org/guide/en/)
