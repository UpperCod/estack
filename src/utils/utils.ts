export let normalizePath = (str: string) =>
    str
        .replace(/[\\\/]+/g, "/")
        .replace(/[\s\(\)\[\]\$\#\?\&\=\¿\!\¡\"\'\{\}\@\<\>\´\`]+/g, "-")
        .replace(/\-+/g, "-")
        .toLowerCase();
