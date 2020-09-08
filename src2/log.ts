import { Log, LogOptions } from "estack";
import * as colors from "colors/safe";
import getProp from "@uppercod/get-prop";

interface Mesages {
    [message: string]: string;
}

function getTime(): string {
    const date = new Date();
    const time = colors.grey(
        [date.getHours(), date.getMinutes(), date.getSeconds()].join(":")
    );
    return `[${time}]`;
}

const template = (
    str: string,
    map: (command: string, index: number) => string,
    index = 0
) =>
    str.replace(/\[([^\s]+)\s+\$\s*\]/g, (all, command) =>
        map(command, index++)
    );

export function createLog(messages?: Mesages): Log {
    const format = (message: string, params: string[]) =>
        template(messages[message] ?? message, (command, index) =>
            getProp<(str: string) => string>(
                colors,
                command,
                (str: string) => str,
                false
            )(params[index])
        );

    return {
        print({ message = "", body, type = "log", params = [] }: LogOptions) {
            let header = "";
            if (type == "log" || type == "alert" || type == "error") {
                header += getTime() + " ";
                header += format(message, params);
            } else {
                header = format(message, params);
            }
            if (header) console.log(header);
            if (body && body.length) {
                console.group();
                body.map(({ src, items }) => {
                    console.log(`${colors.gray(src)}`);
                    console.log(
                        items
                            .map((e) =>
                                type == "alert"
                                    ? colors.yellow(e)
                                    : type == "error"
                                    ? colors.red(e)
                                    : e
                            )
                            .join("\n\n")
                    );
                });
                console.groupEnd();
            }
        },
    };
}
