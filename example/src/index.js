function h(nodeName, props, children) {
  return { nodeName, children, ...props };
}
function App() {
  return <h1>hola mundosssssss</h1>;
}
console.log(App());
