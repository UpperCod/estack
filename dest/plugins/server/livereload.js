export function createLiveReload(path, port) {
    var responses = [];
    var sendMessage = function (res, channel, data) {
        res.write("event: " + channel + "\nid: 0\ndata: " + data + "\n");
        res.write("\n\n");
    };
    var middleware = function (res) {
        res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
        });
        sendMessage(res, "connected", "awaiting change");
        setInterval(sendMessage, 60000, res, "ping", "still waiting");
        responses.push(res);
    };
    var addScriptLiveReload = function (code) {
        return (code += "\n        <script>{\n        let source = new EventSource('http://localhost:" + port + "/" + path + "');\n        source.onmessage = e =>  setTimeout(()=>location.reload(),250);\n        }</script>\n    ");
    };
    var reload = function () {
        responses.forEach(function (res) { return sendMessage(res, "message", "reloading"); });
    };
    return {
        responses: responses,
        reload: reload,
        middleware: middleware,
        addScriptLiveReload: addScriptLiveReload
    };
}
//# sourceMappingURL=livereload.js.map