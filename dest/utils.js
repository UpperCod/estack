export let normalizePath = (str) => str
    .replace(/[\\\/]+/g, "/")
    .replace(/[\s\(\)\[\]\$\#\?\&\=\¿\!\¡\"\'\{\}\@\<\>\´\`]+/g, "-")
    .replace(/\-+/g, "-")
    .toLowerCase();
//# sourceMappingURL=utils.js.map