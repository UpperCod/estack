function h(nodeName, props, children) {
  return {
    nodeName,
    children,
    ...props
  };
}

function App() {
  return h("h1", null, "hola mundosssssss");
}

console.log(App());
//# sourceMappingURL=index.js.map
