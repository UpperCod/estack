import { File, Log, LogParam, LogColors } from "estack";
import * as colors from "colors/safe";

function getTime(): string {
    const date = new Date();
    const time = colors.grey(
        [date.getHours(), date.getMinutes(), date.getSeconds()].join(":")
    );
    return `[${time}]`;
}

const getHeader = (header: string, color: LogColors) =>
    `\n${getTime()} ${color && colors[color] ? colors[color](header) : header}`;

export function createLog(): Log {
    return {
        raw: console.log,
        log: ({ header, body, color }: LogParam) => {
            console.log(getHeader(header, color));
            if (body) {
                console.group();
                console.log(`\n${body}`);
                console.groupEnd();
            }
        },
        alert: ({ header, body, color }: LogParam<File[]>) => {
            console.log(getHeader(header, color));
            if (body.length) {
                console.group();
                body.map(({ alerts, src }) => {
                    console.log(`\n${colors.gray(src)}`);
                    console.group();
                    console.log(
                        alerts.map((e) => colors.yellow(e)).join("\n\n")
                    );
                    console.groupEnd();
                });
                console.groupEnd();
            }
        },
        error: ({ header, body, color }: LogParam<File[]>) => {
            console.log(getHeader(header, color));
            if (body.length) {
                console.group();
                body.map(({ errors, src }) => {
                    console.log(`\n${colors.gray(src)}`);
                    console.group();
                    console.log(errors.map((e) => colors.red(e)).join("\n\n"));
                    console.groupEnd();
                });
                console.groupEnd();
            }
        },
    };
}
