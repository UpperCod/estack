import logUpdate from "log-update";
import colors from "colors/safe";

const DEBUG = "debug";
const BUILD = "build";
const HEADER = "header";
const FOOTER = "footer";
const LOADING = "loading";

let play;
let load = new Promise((r) => (play = r));

let marks = {};

let messageError = {
  [LOADING]: "",
  [HEADER]: {},
  [DEBUG]: {},
  [FOOTER]: {},
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

let id = 0;

async function log(message, type, mark, fail) {
  message += "";

  if (type != LOADING) {
    if (messageError[type]) {
      let select = messageError[type];
      if (type == HEADER || type == FOOTER) {
        select[mark] = message;
      } else {
        select[mark] = select[mark] || [];
        select.push(message);
      }
    }

    if (type == BUILD || type == HEADER || type == FOOTER) {
      await load;

      let allMessagesDebug = Object.keys(messageError[DEBUG])
        .map((mark) => messageError[DEBUG][mark])
        .flat()
        .filter((value) => value);

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
        ]) +
        "\n";

      let allMessageHeader = Object.keys(messageError[HEADER]).map((i) =>
        colors.bold(messageError[HEADER][i])
      );

      let allMessageFooter = Object.keys(messageError[FOOTER]).map((i) =>
        colors.bold(messageError[FOOTER][i])
      );

      message = [
        ...allMessageHeader,
        ...allMessagesDebug,
        allMessageBuild,
        ...allMessageFooter,
      ]
        .filter((value) => value)
        .join("\n");
    } else {
      message = null;
    }
  }

  if (message != null) {
    logUpdate(message);
  }
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
}

export let logger = {
  debug(message, mark) {
    return log(message, DEBUG, mark);
  },
  header(message) {
    let i = id++;
    console.log({ i });
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
    return (marks[mark] = { start: new Date() });
  },
  markBuild(mark) {
    return log("", BUILD, mark);
  },
  markBuildError(message, mark) {
    log(message, DEBUG, mark);
    return log("", BUILD, mark, true);
  },
  play() {
    clearLoading();
    log(" ", LOADING);
    play();
  },
};
