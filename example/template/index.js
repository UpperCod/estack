export function template(data) {
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
      <body>
        <doc-page>
          <doc-aside links=${JSON.stringify(links)} logo="${logo}"></doc-aside>
          <doc-content>${content}</doc-content>
          <doc-aside></doc-aside>
        </doc-page>
        <script type="module" src="doc-page.js"></script>
      </body>
    </html>
  `;
}
