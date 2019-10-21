let e = document.createElement("div");
document.appendChild(e),
	(e.innerHTML = "<h1>App 1</h1>"),
	e.addEventListener("click", () => {
		console.log(
			"button{color:orange;size:20px}.box{width:100px;height:100px;color:#000}"
		);
	}),
	(e.cons = Symbol("every!")),
	(e.click = function*() {
		return yield 10, 20;
	});
//# sourceMappingURL=index.js.map
