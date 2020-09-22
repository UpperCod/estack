---
title: EStack
description: Generador de sitios estático para un desarrollo moderno
order: 1
linkTitle: Introducción
category: aside
---

EStack agrupa bajo un único observador una serie de herramientas recurrentes para un desarrollo moderno escalable:

<doc-row col="1fr 1fr 1fr, 1fr 1fr 520w" gap="2rem">

<div>

### Servidor de desarrollo

El modo `dev` crea un servidor con livereload que
elimina evita la escritura en disco.

</div>

<div>

### Frontmatter

variables de pagina en la
cabecera del documento

```yaml
title: my page...
items:
    $ref: items.json
thumbnail:
    $link: header.jpg
```

</div>

<div>

### Multilenguaje

EStack relaciona el lenguaje de página a base
de extensiones, ej:

```bash
index.es.md # Español
index.fr.md # Francés
index.md    # Ingles
```

</div>

<div>

### Gestionar Assets

Estack captura todos los assets
declarados en el frontmatter o template

</div>

<div>

### Gestionar CSS

Los assets de tipo CSS son procesados
por Postcss

</div>

<div>

### Gestionar JS

Los assets de tipo JS son procesados por
Rollup

</div>

</doc-row>
