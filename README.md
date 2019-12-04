## bundle-cli

CLI for the generation of applications based on es6 modules, bundle-cli allows **multiple types of input based on expressions**, eg `src/**.html`, the inputs can based on the following extensions accept`.css`, `.html`,`.js`, `.ts`,`jsx` and `tsx`. `bundle-cli` extracts the scripts declared in the `.html` based on the expression `script[type=module][src=*]`, if you use the flag `--server` and `--watch` it will enable **livereload**, `bundle-cli` will dispatch the reload event to the html served each time a modification occurs.

`bundle-cli [src] [dist]`

where :

- `src` : expression that allows you to define one or more entries for rollup, eg `src/**.html`,`src/**.css` or `src/**.html,src/**.js`.
- `dist` : bundle destination

`--server`

Create a server, by default localhost: 8080, when used together with the flat --watch, enable livereload to the html files served

`-w | --watch`

observe the changes to generate a new bundle

`-e | --external`

It allows to define if the `package.dependencies` should be added to the bundle,

`--browsers`

Modify the output of the css and js code, based on browser coverage

`--minify`

minify the code only if the flag --watch is not used

### extend babel settings

define the bable property within your package, The bundle will take the plugins and presets of the configuration and make a merge of it, you can rewrite them by default.
