import url from "url";
import http from "http";
import https from "https";
import descompress from "decompress-response";
import { isJsonContent } from "./types";

/**
 * generate a request to obtain data
 * @param {string} uri
 * @returns {Promise<[string,any]>}
 */
export let request = (uri) =>
    new Promise((resolve, reject) => {
        let dataUri = new url.URL(uri);
        let fn = dataUri.protocol == "https:" ? https : http;
        fn.get(uri, { headers: { "user-agent": "node.js" } }, (res) => {
            res = descompress(res);
            res.setEncoding("utf8");
            let chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                let data = chunks.join("");
                if (res.statusCode > 300 && res.headers.location) {
                    // recursively resolve the redirect
                    request(url.resolve(uri, res.headers.location)).then(
                        resolve,
                        reject
                    );
                } else {
                    resolve([
                        uri,
                        isJsonContent(data) ? JSON.parse(data) : data,
                    ]);
                }
            });
        }).on("error", reject);
    });
