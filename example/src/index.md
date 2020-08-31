---
$global: en
title: EStack generador de sitios estatico moderno
description: EStack orqueta assets.
site:
    $ref: site.yaml
---

Estack es una sola dependencia que empaqueta y sincronziar una serie de herramientas para un desarrollo moderno, agil y escalable.

1. [Rollup](#): para procesar los assets de extension **js, jsx, ts y tsx**.
2. [Postcss](#) y [Stylis](#): para procesar assets tipo **css**.
3. [Liquid](#): Para procesar los ficheros de extension **html y md**
4. **Servidor de desarrollo**: El modo dev propiorciona un servidor de desarrollo que optimiza el contenido servido evitado la escritura de este en disco.
5. **Assets relativos**: Los assets se relacionan y resuelven desde el importador, por lo que ud podra poseeer assets correctamente asilados, los asset no colicionaran ya que Estack los hachea los nombres.
6. **Frontmatter declarativo**: Con el frontmatter(Metadata de cabezera) de EStack podras generar consultas de paginas, paginas de archivos, request, enlazar documentos, data y assets locales.

## Instalación

```
npm install -D estack
```

## Uso

<doc-tabs auto-height tabs="package.json, src/index.html, src/index.js">

```json
{
    "scripts": {
        "dev": "estack dev src/**/*.html",
        "build": "estack build src/**/*.html public"
    },
    "devDependencies": {
        "estack": "^0.16.0"
    }
}
```

```html
---
title: my page with EStack
---

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{{ page.title }}</title>
        <!--
        Liquid capturara los asset que declare el fitro asset
        -->
        <script src="{{ 'index.js' | asset }}" type="module"></script>
    </head>
    <body></body>
</html>
```

```js
console.log("hello word");
```

</doc-tabs>
