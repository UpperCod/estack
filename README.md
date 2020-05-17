# bundle-cli

bundle-cli se creo para minimizar el impacto del desarrollo en en el uso de dissco(Una estrategia inpirada en Stenci), su node_module solo contendra los packages rollup y bundle-cli tras la instalacion , **Bundle-cli posee como objetivo ser un entorno de desarrollo dinamico y amigable para webcomponents, con este CLI ud podra:**

1. Exportar assets desde ficheros html y markdown creados sobre la marcha, un efecto similar a ParselJs.
2. Añadir html, markdowns y assets que se sincronizan de forma dinamica en modo watch para la regeneracion del bundle o reload del navegador.
3. Exportaciones mediante expreciones.0
4. Servidor con livereload, sincronizado a la regeneracion del bundle.
5. Minificacion y más

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

## Ejemplo de uso

Se recomienda el uso de bundle-cli definiendo los scripts en su package.json, eg:

```json
{
  "scripts": {
    "start": "bundle example/src/**/*.{html,md} public --server --watch",
    "build": "bundle example/src/*.{html,md} public --minify bundle"
  }
}
```
