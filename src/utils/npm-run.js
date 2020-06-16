import { spawn } from "child_process";

let current;
/**
 * The process is based on an example given by the nodejs documentation
 * {@link https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options}
 * Search "Example: A very elaborate way to run ps ax | grep ssh" text for a better reference
 * @param {string} task
 * @param {()=>void} streamLog
 * @returns {Promise}
 */
export async function npmRun(task, streamLog) {
  if (current) {
    try {
      current.stdin.end();
      current.cancel = true;
      //current.kill();
    } catch (e) {
      console.log({ e });
    }
  }

  return new Promise((resolve, reject) => {
    let subProcess = (current = spawn("npm", ["run", task], { shell: true }));
    let currentData;
    let currentDataError;
    subProcess.stdout.on("data", (message) => {
      if (subProcess.cancel) return;
      currentData = message;
      streamLog && streamLog(message);
    });

    subProcess.stderr.on("data", (message) => {
      if (subProcess.cancel) return;
      currentDataError = message;
      streamLog && streamLog(message);
    });

    subProcess.on("exit", () => {
      if (subProcess.cancel) return;
      if (currentData != null) {
        resolve(currentData || "");
      }
      if (currentDataError != null) {
        reject(currentDataError || "");
      }
    });

    subProcess.on("error", (error) => {
      if (subProcess.cancel) return;
      reject(error);
    });
  });
}
