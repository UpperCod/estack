export function createLiveReload(path, port) {
    const responses = [];
    const sendMessage = (res, channel, data) => {
        res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
        res.write("\n\n");
    };
    const middleware = (res) => {
        res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        });
        sendMessage(res, "connected", "awaiting change");
        setInterval(sendMessage, 60000, res, "ping", "still waiting");
        responses.push(res);
    };
    const addScriptLiveReload = (code) => (code += `
        <script>{
        let source = new EventSource('http://localhost:${port}${path}');
        source.onmessage = e =>  setTimeout(()=>location.reload(),250);
        }</script>
    `);
    const reload = () => {
        responses.forEach((res) => sendMessage(res, "message", "reloading"));
    };
    return {
        responses,
        reload,
        middleware,
        addScriptLiveReload,
    };
}
//# sourceMappingURL=livereload.js.map