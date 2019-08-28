var style = `:root {
	--color: black;
}
button {
	color: orange;
	size: 20px;
}
megalodonte {
	color: orange;
}
.box {
	width: 100px;
	height: 100px;
	color: black;
}
`;

var div = document.createElement("div");
document.appendChild(div);
div.innerHTML = "<h1>App 1</h1>";
div.addEventListener("click", function () {
  console.log(style);
});
//# sourceMappingURL=index.js.map
