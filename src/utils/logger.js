import logUpdate from "log-update";
import colors from "colors/safe";

const DEBUG = "debug";
const BUILD = "build";
const HEADER = "header";
const FOOTER = "footer";
const FORCE = "force";
const LOADING = "loading";

const STATUS_REJECTED = "Rejected";
const STATUS_RESOLVED = "Resolved";
const STATUS_PENDING = "Pending";

let play;
let load = new Promise((r) => (play = r));

let message = colors.bold("loading");

let marks = {};

let messageError = {
    [LOADING]: "",
    [HEADER]: {},
    [DEBUG]: {},
    [FOOTER]: {},
};

let dots = 3;
let id = 0;

async function log(message, type, mark, fail) {
    message += "";

    if (type != LOADING) {
        if (type != FORCE && messageError[type]) {
            let select = messageError[type];
            if (type == HEADER || type == FOOTER) {
                select[mark] = message;
            } else {
                select[mark] = select[mark] || [];

                select[mark].push(message);
            }
        }

        if (
            type == BUILD ||
            type == HEADER ||
            type == FOOTER ||
            type == FORCE
        ) {
            await load;
            let allMessagesDebug = Object.keys(messageError[DEBUG])
                .map((mark) => messageError[DEBUG][mark])
                //@ts-ignore
                .flat()
                .filter((message) => message)
                .map((message) => colors.red(message));

            if (!fail) messageError[DEBUG][mark] = []; // clean messages associated only with build cycle

            let allMessageBuild = Object.keys(marks).map((prop) => {
                let markRef = marks[prop];

                if (type == BUILD && mark == prop) {
                    let { start } = markRef;
                    markRef.start = new Date();
                    markRef.duration = markRef.start - start;
                }

                let { duration, start } = markRef;
                let status =
                    fail && prop == mark
                        ? STATUS_REJECTED
                        : duration
                        ? STATUS_RESOLVED
                        : STATUS_PENDING;
                return [
                    prop,
                    status,
                    status == STATUS_PENDING
                        ? "..."
                        : duration >= 100
                        ? (duration / 1000).toFixed(1) + "s"
                        : duration + "ms",
                    colors.grey(
                        [
                            start.getHours(),
                            start.getMinutes(),
                            start.getSeconds(),
                        ]
                            .map((value) => (value < 10 ? "0" + value : value))
                            .join(":")
                    ),
                ];
            });

            allMessageBuild = stringTable([
                ["Build", "Status", "Duration", "Time"],
                ...allMessageBuild,
            ]);

            let allMessageHeader = Object.keys(messageError[HEADER]).map((i) =>
                colors.green(colors.bold(messageError[HEADER][i]))
            );

            let allMessageFooter = Object.keys(messageError[FOOTER]).map((i) =>
                colors.gray(messageError[FOOTER][i])
            );

            message = [
                ...addPadding(" ", allMessageHeader),
                allMessageBuild,
                ...addPadding(" ", allMessagesDebug, -1),
                ...addPadding(" ", allMessageFooter, -1),
            ]
                .filter((value) => value)
                .join("\n");
        } else {
            message = null;
        }
    }
    if (typeof message == "string" && message) {
        try {
            if (!process.env.silent) {
                logUpdate(message);
            }
        } catch (e) {
            console.log(message);
        }
    }
}
/**
 * Add a line break only if the array has indexes
 * @param {string[]} list
 * @param {1|-1} [position] - if it is equal to -1 the line break
 *                            will be added at the beginning in the
 *                            array, opposite case the line break in
 *                            the array will be added at the end
 * @returns {list}
 */
function addPadding(padding, list, position) {
    if (list.length) {
        list[position == -1 ? "unshift" : "push"](padding);
    }
    return list;
}

function stringTable(rows, padding = 2) {
    let spaces = rows.reduce(
        (spaces, row) =>
            row.reduce((spaces, value, index) => {
                value = "" + value;
                if (spaces[index] < value.length || spaces[index] == null) {
                    spaces[index] = value.length;
                }
                return spaces;
            }, spaces),
        []
    );
    return rows
        .map((row, indexRow) =>
            row
                .map((value, indexColumn) => {
                    let isColorRed = value == STATUS_REJECTED;
                    value =
                        value +
                        " ".repeat(
                            spaces[indexColumn] - value.length + padding
                        );
                    return isColorRed
                        ? colors.red(value)
                        : indexRow == 0
                        ? colors.grey(colors.bold(value))
                        : indexColumn == 0
                        ? colors.bold(value)
                        : value;
                })
                .join("")
        )
        .join("\n");
}

export let logger = {
    load() {
        let getMessage = (dots) => message + colors.green(".".repeat(dots));

        log(getMessage(dots));

        let interval = setInterval(() => {
            dots = dots == 0 ? 3 : dots;
            log(getMessage(dots--), LOADING);
        }, 250);

        return () => {
            clearInterval(interval);
            log(" ", LOADING);
            play();
        };
    },
    debug(message, mark) {
        return log(message, DEBUG, mark);
    },
    header(message) {
        let i = id++;
        let send = (message) => log(message, HEADER, i);
        send(message);
        return send;
    },
    footer(message) {
        let i = id++;
        let send = (message) => log(message, FOOTER, i);
        send(message);
        return send;
    },
    mark(mark) {
        marks[mark] = { start: new Date() };
        return log("", FORCE);
    },
    markBuild(mark) {
        return log("", BUILD, mark);
    },
    markBuildError(message, mark) {
        log(message, DEBUG, mark);
        return log("", BUILD, mark, true);
    },
};
