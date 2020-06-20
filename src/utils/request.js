import url from "url";
import http from "http";
import https from "https";
import { isJsonContent } from "./types";

/**
 * generate a request to obtain data
 * @param {string} uri
 * @returns {Promise}
 */
export let request = (uri) =>
  new Promise((resolve, reject) => {
    let dataUri = url.parse(uri);
    (dataUri.protocol == "https:" ? https : http)
      .get(uri, { headers: { "user-agent": "node.js" } }, (res) => {
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(res);
          }
          if (res.statusCode > 300 && res.headers.location) {
            // recursively resolve the redirect
            request(url.resolve(dataUri.path, res.headers.location)).then(
              resolve,
              reject
            );
          } else {
            resolve(isJsonContent(data) ? JSON.parse(data) : data);
          }
        });
      })
      .on("error", reject);
  });
