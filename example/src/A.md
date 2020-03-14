---
title: A
folder: /markdown
description: I am A
group:
  - Markdown
---

<link rel="stylesheet" href="style.css" />

# {{page.title}}

{{# when page.title "==" "A" }}
... i am AAAAAAAAAAAAAAAA {{page.folder}}
{{else}}
....
{{/when}}

{{when page.title "with title" "...require title"}}

```yaml
---
title: A
folder: /markdown
description: I am A
group:
  - Markdown
---
```

<script src="index.js"></script>
