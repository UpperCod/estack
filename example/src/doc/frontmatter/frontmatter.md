---
title: Frontmatter
---

El uso del frontmatter es opcional.

```yaml
link: my/page
```

### slug: _string_

Declara el nombre de base del archivo, por defecto este es el nombre del mismo archivo

### folder: _string_

Declara la carpeta del recurso

### link: _string_

Alias **permalink**, declara el link hacia el recurso, es equivalente a usar **folder** + **slug**.

### query: _object_

La propeidad query permite ejecutar consultas sobre el recurso html y markdow observador por EStack.

```yaml
query:
    posts:
        # Determina el limite de paginas a asociar a la query
        limit: 5
        # Propiedades a usar para la busqueda
        find:
            tag: posts # Equibale a la exprexion page.tag == "posts"
        # Propiedad a usar para ordenar los resultados de busqueda
        sort:
            date: -1
```

### archive: _object_

La propeidad archive permite ejecutar consultas sobre el recurso html y markdow observador por EStack y generar paginas de archivos a base de esta consulta

```yaml
archive:
    # Determina el limite de paginas a asociar a la paginacion
    limit: 5
    # Propiedades a usar para la busqueda
    find:
        tag: posts # Equibale a la exprexion page.tag == "posts"
    # Propiedad a usar para ordenar los resultados de busqueda
    sort:
        date: -1
```

## Asociar links

**Asociar links de pagina** : La propiedad **\$link** permite construir un link seguro hacia la pagina.

```yaml
subpage:
    $link: ../subpage.md
```

**Asociar links de assets**: La propiedad **\$link** permite construir un link seguro hacia el asset. A diferencia del link de pagia este emite un error si el recurso no existe.

```yaml
subpage:
    $link: ../image.jpg
```
