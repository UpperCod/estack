import * as colors from "colors/safe";
import getProp from "@uppercod/get-prop";

interface Message {
    message?: string;
    items?: Message[];
    params?: (string | number)[];
    raw?: any;
}

function getTime(): string {
    const date = new Date();
    const time = colors.grey(
        [date.getHours(), date.getMinutes(), date.getSeconds()]
            .map(dateToFixed)
            .join(":")
    );
    return `[${time}]`;
}

const dateToFixed = (value: number) => (value < 10 ? "0" + value : value);

const template = (
    str: string,
    map: (command: string, index: number) => string,
    index = 0
) =>
    str.replace(/\[([^\s]+)\s+\$\s*\]/g, (all, command) =>
        map(command, index++)
    );

export function log({ message, items, params = [], raw }: Message) {
    const time = getTime();

    let header = message
        ? template(message, (command, index) =>
              getProp<(str: string) => string>(
                  colors,
                  command,
                  (str: string) => str,
                  false
              )(params[index] + "")
          )
        : "";

    header = header.replace(/\[time\]/g, time);

    if (header) console.log(header);

    if (items || raw) {
        console.group();
        if (raw) {
            console.log(raw);
        } else {
            items.map(log);
        }
        console.groupEnd();
    }
}
