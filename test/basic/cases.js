module.exports = [
  {
    file: "index.html",
    data: [
      `<link rel="stylesheet" href="code-css.css">`,
      `<script type="module" src="code-js.js"></script>`,
      `<script type="module" src="code-ts.js"></script>`,
    ],
  },
  {
    file: "code-css.css",
    data: [`body {`, `  color: red;`, `}`],
  },
  {
    file: "code-js.js",
    data: [`console.log("js");`],
  },
  {
    file: "code-ts.js",
    data: [`console.log("ts");`],
  },
];
