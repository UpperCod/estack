import url from "url";
import http from "http";
import https from "https";

/**
 * generate a request to obtain data
 * @param {string} uri
 * @returns {Promise}
 */
export let requestJson = (uri) => {
  return new Promise((resolve, reject) => {
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
            requestJson(url.resolve(dataUri.path, res.headers.location)).then(
              resolve,
              reject
            );
          } else {
            resolve(JSON.parse(data));
          }
        });
      })
      .on("error", reject);
  });
};
