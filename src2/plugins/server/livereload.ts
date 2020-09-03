import { ServerResponse } from "http";

export function createLiveReload(path: string, port: number) {
    const responses: ServerResponse[] = [];

    const sendMessage = (
        res: ServerResponse,
        channel: string,
        data: string
    ) => {
        res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
        res.write("\n\n");
    };

    const middleware = (res: ServerResponse) => {
        res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        });
        // Send an initial ack event to stop any network request pending
        sendMessage(res, "connected", "awaiting change");
        // Send a ping event every minute to prevent console errors
        setInterval(sendMessage, 60000, res, "ping", "still waiting");
        // Watch the target directory for changes and trigger reload
        responses.push(res);
    };

    const addScriptLiveReload = (code: string) =>
        (code += `
        <script>{
        let source = new EventSource('http://localhost:${port}/${path}');
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
