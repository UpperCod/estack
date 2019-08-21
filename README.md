# bundle-cli

cli a base de rollup, que añade una capa de configuración simple y ágil para la generación de bundle, con los siguientes beneficios:

1. **multi entradas independientes**, rollup es asombroso, la configuración `{input:["file-a.js","file-b.js"]}`, es algo recurrente en mi configuración, pero esta quita agilidad ante la necesidad de múltiples entradas, obligando a rescribir la configuración.
   para mejorar esto bundle-cli admite expresiones `src/*.js` y observa de estas expresiones la creacion de ficheros , logrando así reiniciar el bundle sin reconfigurarlo manualmente.

2. **input html**, en algunos espacios de trabajo se requiere el uso de un fichero html que importe el bundle, bundle-cli, permite leer y generar un nuevo fichero que apunte al bundle ya generado por rollup, este input también puede ser definido como expresión `src/*.html`.

3. **input css**, permite la importación del código css local o agrupación en bundles de estilo, todo esto preprocesado mediante postcss, configurado con postcss-preset-env y cssnano.

4. **configuracion mediante package.json**, permite importar del package.json la configuración de babel y fusionarla con la actual, adicionalmente ud puede definir `pkg.bundle.browsers` y afectar tanto babel como postcss. el cli observa el estado del package para asi rehacer el bundle, eg ante la instalación de una nueva dependencia.

## cli

```
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

## ejemplos de configuracion

```bash
bundle src/*.html,src/*.css
```

generará exportaciones compartidas entre los ficheros html gracias a rollup y a su vez como el css se define como entrada, se generará ficheros independientes de css para ser usados.

## Todo

1. [] : lograr que pueda leer los ficheros css desde el html para una mejor exportacion.
2. [] : permitir que escanee los fragmentos de javascript fuera de script[type=module], para ser paseados por babel
3. [] : añadir los test de generación de ficheros, tomar como base **microbundle** o **module-css/rollup**.
