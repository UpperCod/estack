---
title: EStack
description: En entorno productivo basado en una pila de herramientas perfectamente sincornizadas
link: es/rollup
linkTitle: Rollup
lang: es
tag: doc
order: 3
---

EStack captura los assets asociados a cada pagina y los ditribuye entre procesos, Rollup se encarga de procesar los assets tipo Javasript y Typescript
La configuracion de rollup esta pensada para entornos modernos, ya que no trabaja los ficheros js de forma independiente los asocia en un array, eg:

```html
<script src="{{ './foo.js' }}" type="module"></script>
<script src="{{ './bar.ts' }}" type="module"></script>
<script src="{{ './muu.jsx' }}" type="module"></script>
```

Los assets a porcessar por rollup seran listado sen un array, esto permite que rollup optimize las dependencias entre ficheros de Javascript.

### Plugins configurados

| plugin                      |     |
| --------------------------- | --- |
| @rollup/plugin-node-resolve |     |
| @rollup/plugin-json         |     |
| @rollup/plugin-commonjs     |     |
| @rollup/plugin-sucrase      |     |

### Plugins de uso internos

**terser**: la configuracion de terser esta optimziado para lograr un package sin dependencias, no se implemento rollup-plugin-terser, dado que como autor no logre empaquetar este plugins dentro de la build dado el uso de jest. **El codigo js solo es minificado al usar el flag `--minify`**

**stylis**: Potente preprocesador de css ligero y de ast amigable para custumizar efectos de importacion y más.

**import-url**: Esta es una implementacion que permite consumir modulos js desde url como si fueran locales.

### Resolucion local de modulos

La configuracion de Rollup permite la importacion de modulos ES y CJS probenientes de node_modules, sin la necesidad de declarar la ruta hacia node_modules.

```js
import { h } from "atomico";

console.log(h);
```

### Resolucion de modulos como URL

La cofiguracion de Rollup en Estack permite importar Js o Ts desde fuentes externas como modulos, eg:

```js
import { h } from "https://unpkg.com/atomico";

console.log(h);
```

Al momento de Arrancar EStack se generara un request a la fuente esta sera cacheada por toda la instancia de EStack, la ventaja de este tipo de uso es que permite aplicar tree-shaking y saltar el paso de instalacion asociado a NPM.
