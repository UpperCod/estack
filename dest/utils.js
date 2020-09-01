export var normalizePath = function (str) {
    return str
        .replace(/[\\\/]+/g, "/")
        .replace(/[\s\(\)\[\]\$\#\?\&\=\¿\!\¡\"\'\{\}\@\<\>\´\`]+/g, "-")
        .replace(/\-+/g, "-")
        .toLowerCase();
};
//# sourceMappingURL=utils.js.map