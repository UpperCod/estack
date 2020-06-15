import { spawn } from "child_process";
import { logger } from "./logger";

let footerLog = logger.footer("");

let current;

export async function npmRun(task, build, error) {
  if (current) current.stdin.end();

  let subProcess = (current = spawn("npm", ["run", task], { shell: true }));

  subProcess.stdout.on("data", (message) => {
    build();
    footerLog(message);
  });

  subProcess.stderr.on("data", (message) => {
    error();
    footerLog(message);
  });

  subProcess.on("close", (message) => {
    build();
  });
}
