## bundle-cli

This CLI simplify the development of packages or applications, thanks to the use of rollup, adding to this:

Observers of files (html, js and css) based on expressions, for the generation of inputs to work by rollup, eg:

```
bundle src/*.html,src/*.js,src/css/*.css
```

construction of html files, which share chunk type dependencies of the js imported by the tag `script[type=module]` locally, eg:

**input:index.html**

```html
<script src="./a.js" type="module"></script>
<script src="./a.js" type="module"></script>
```

**output:index.html**

```html
<script src="./index.js" type="module"></script>
```

construction of css files when declared as input, if not declared as input, it will return the css as text processed by postcss, eg:

```
import style "./style.css";
console.log(style) //content of style.css, ideal for web-components
```

> the alRule import are grouped in the export file

## default settings

bundle-cli, makes use of the following plugin:

[**rollup-plugin-resolve **](https://github.com/rollup/rollup-plugin-node-resolve): allows to maintain a node.js style import

[**rollup-plugin-babel**](https://github.com/rollup/rollup-plugin-babel): supports its configuration from the package.json by reading from this `babel.presets` and`babel.plugins`, by default it attaches, `@babel/preset-env` and `@babel/plugin-transform-react-jsx` with pagma `h`.

[**postcss**](https://postcss.org/): bundle-cli, only supports css, but to enhance its use, add `postcss-preset-env` and`cssnano` by default.

[**rollup-plugin-terser**](https://www.npmjs.com/package/rollup-plugin-terser) and [**@atomico/rollup-plugin-sizes**](https://www.npmjs.com/package/@atomico/rollup-plugin-sizes)

> los plugins de mitificación solo operan en modo build.

## cli

```cmd
  Usage
    $ bundle [src] [dest] [options]

  Options
    -w, --watch       Watch files in bundle and rebuild on changes  (default false)
    -e, --external    Does not include dependencies in the bundle  (default false)
    --shimport        enable the use of shimport in the html  (default false)
    --browsers        define the target of the bundle  (default last 2 versions)
    -v, --version     Displays current version
    -h, --help        Displays this message

  Examples
    $ bundle src/index.js dist --watch
    $ bundle src/*.js dist
    $ bundle src/*.html
    $ bundle
```

## Use example

Simple export of web-components and preview of this.

**project directory**

```
/src
	/web-components
		/ui-a
			ui-a.js
		/ui-b
			ui-b.js
		/ui-c
			ui-c.js
	/input.html
```

**bundle-cli for preview**

```
bundle src/index.html public -w
```

**web-components export bundle**

```
bundle src/web-components/**/*.js --external
```

`--external` allows rollup to ignore dependencies and peerDependencies.

## todo

-   [ ] read from the html the styles used locally and generate a bundle that groups them to be then grafted into the html
-   [ ] add tests on the cli, to verify bundle integration.
-   [ ] minificar el html generado
-   [ ] add support to a server that supports the issuance of updates, can be activated under the prefix `--server`
