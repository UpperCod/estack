# bundle-cli

bundle-cli is created to minimize the impact of development on disk usage, its node_module will only contain rollup and bundle-cli packages after installation, **Bundle-cli aims to be a dynamic and friendly development environment for webcomponents, with this CLI you can:**

1. Export assets from html and markdown files created on the fly, an effect similar to ParselJs, but without the limitation of only one index.html, bundle-cli parses based on an expression so you can add files on the mark and automatically bundle-cli processes them.
2. Add html, markdowns and assets that are dynamically synchronized in watch mode for the regeneration of the bundle or browser reload.
3. Exports using expressions.
4. Server with livereload, synchronized to the regeneration of the bundle.
5. Minification and more.

### npx bundle --help

```
  Usage
    $ bundle [src] [dest] [options]

  Options
    --watch          Watch files in bundle and rebuild on changes  (default false)
    --external       Does not include dependencies in the bundle
    -c, --config     allows you to export a configuration from package.json
    --sourcemap      enable the use of sourcemap  (default true)
    --server         Create a server, by default localhost:8000  (default false)
    --port           define the server port  (default 8000)
    --proxy          redirect requests that are not resolved locally  (default false)
    --sizes          Displays the sizes of the files associated with rollup  (default false)
    --jsx            pragma jsx  (default h)
    --jsxFragment    pragma fragment jsx  (default Fragment)
    --minify         minify the code only if the flag --watch is not used  (default false)
    -v, --version    Displays current version
    -h, --help       Displays this message

  Examples
    $ bundle src/index.html public --watch --server
    $ bundle src/index.html public --external
    $ bundle src/index.html public --external react,react-dom
    $ bundle src/index.js dist --watch
    $ bundle src/*.js dist
    $ bundle src/*.{html,md}
    $ bundle
```

## Recommended use

We recommend using bundle-cli by defining the scripts in your package.json, eg:

```json
{
  "scripts": {
    "start": "bundle example/src/**/*.{html,md} public --server --watch",
    "build": "bundle example/src/*.{html,md} public --minify bundle"
  }
}
```
