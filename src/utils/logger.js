import logUpdate from "log-update";
import colors from "colors/safe";

const DEBUG = "debug";
const BUILD = "build";
const FIXED = "fixed";
const LOADING = "loading";

let play;
let load = new Promise((r) => (play = r));

let marks = {};

let messageError = {
  [FIXED]: [],
  [DEBUG]: {},
};

let log = async (message, type, mark, fail) => {
  message += "";

  if (messageError[type]) {
    let select = messageError[type];
    if (type != FIXED) {
      select = select[mark] = select[mark] || [];
    }
    select.push(message);
  }

  if (type != LOADING) {
    if (type == BUILD) {
      await load;

      let allMessagesDebug = Object.keys(messageError[DEBUG])
        .map((mark) => messageError[DEBUG][mark])
        .flat();

      if (!fail) messageError[DEBUG][mark] = []; // clean messages associated only with build cycle

      let allMessageBuild = Object.keys(marks).map((prop) => {
        let markRef = marks[prop];

        if (mark == prop) {
          let { start } = markRef;
          markRef.start = new Date();
          markRef.duration = markRef.start - start;
        }

        let { duration, start } = markRef;

        return [
          prop,
          fail && prop == mark ? "Error" : markRef.duration ? "Ready" : "Await",
          duration
            ? duration > 500
              ? (duration / 1000).toFixed(1) + "s"
              : duration + "ms"
            : "...",
          colors.grey(
            [start.getHours(), start.getMinutes(), start.getSeconds()]
              .map((value) => (value < 10 ? "0" + value : value))
              .join(":")
          ),
        ];
      });

      allMessageBuild =
        "\n" +
        stringTable([
          ["Build", "Status", "Duration", "Time"],
          ...allMessageBuild,
        ]);

      message = [
        ...messageError[FIXED].map(
          (message) => "→ " + colors.bold(colors.cyan(message))
        ),
        ...allMessagesDebug,
        allMessageBuild,
      ].join("\n");
    } else {
      message = null;
    }
  }

  if (message) {
    logUpdate(message);
  }
};

let message = colors.bold("loading");
let dots = 3;
let getMessage = (dots) => message + colors.green(".".repeat(dots));
log(getMessage(dots));

let interval = setInterval(() => {
  dots = dots == 0 ? 3 : dots;
  log(getMessage(dots--), LOADING);
}, 250);

let clearLoading = () => clearInterval(interval);

export let logger = {
  play: () => {
    clearLoading();
    log("", LOADING);
    play();
  },
  debug: (message, mark) => log(message, DEBUG, mark),
  fixed: (message) => log(message, FIXED),
  mark: (mark) => (marks[mark] = { start: new Date() }),
  markBuild: (mark, fail) => log("", BUILD, mark, fail),
};

let stringTable = (rows, padding = 2) => {
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
          let isError = value == "Error";
          value =
            value + " ".repeat(spaces[indexColumn] - value.length + padding);
          return isError
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
};
