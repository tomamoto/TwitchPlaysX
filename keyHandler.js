let exec = require("child_process").exec,
  config = require("./config.js"),
  lastTime = {},
  windowID = "unfilled",
  throttledCommands = config.throttledCommands,
  regexThrottle = new RegExp("^(" + throttledCommands.join("|") + ")$", "i"),
  regexFilter = new RegExp(
    "^(" + config.filteredCommands.join("|") + ")$",
    "i"
  );

let isWindows = process.platform === "win32";

(function setWindowID() {
  if (!isWindows & windowID === "unfilled") {
    exec("xdotool search --onlyvisible --name " + config.programName, function (
      error,
      stdout
    ) {
      windowID = stdout.trim();
      // console.log(key, windowID);
    });
  }
})();

for (let i = 0; i < throttledCommands.length; i++) {
  lastTime[throttledCommands[i]] = new Date().getTime();
}

let defaultKeyMap = config.keymap || {
  up: "Up",
  left: "Left",
  down: "Down",
  right: "Right",
  a: "a",
  b: "b",
  holda: "a",
  unholda: "a",
  holdb: "b",
  unholdb: "b",
  x: "x",
  y: "y",
  start: "s",
  select: "e",
};

// Key categories used to determine xdotool logic
let dpadDirections = ["up", "down", "left", "right"];
let holds = ["holda", "holdb"]
let unholds = ["unholda", "unholdb"]

function isDpad(command) {
  if (dpadDirections.includes(command)) {
    return true;
  }
  return false;
}

function isHold(command) {
  if (holds.includes(command)) {
    return true;
  }
  return false;
}

function isUnhold(command) {
  if (unholds.includes(command)) {
    return true;
  }
  return false;
}

function sendKey(command) {
  //if doesn't match the filtered words
  if (!command.match(regexFilter)) {
    let allowKey = true;
    let key = defaultKeyMap[command] || command;
    //throttle certain commands (not individually though)
    if (key.match(regexThrottle)) {
      let newTime = new Date().getTime();
      if (newTime - lastTime[key] < config.timeToWait) {
        allowKey = false;
      } else {
        lastTime = newTime;
      }
    }
    if (allowKey) {
      if (isWindows) {
        //use python on windows
        // "VisualBoyAdvance"
        // "DeSmuME 0.9.10 x64"
        exec("python key.py" + "  " + config.programName + " " + key);
      } else {
        //Send to preset window under non-windows systems
        if (isDpad(command)) { // Hold key if it is a dpad key
          exec(
            "xdotool keydown --window " +
              windowID +
              " --delay " +
              config.holdTime +
              " " +
              key +
              " keyup --window " +
              windowID +
              " --delay " +
              config.delay +
              " " +
              key
          );
        } else if (isHold(command)) {
          exec(
            "xdotool keydown --window " +
              windowID +
              " --delay " +
              config.delay +
              " " +
              key
          );
        } else if (isUnhold(command)) {
          exec(
            "xdotool keyup --window " +
              windowID +
              " --delay " +
              config.delay +
              " " +
              key
          );
        } else { // simply press key if it is not a dpad key
          exec(
            "xdotool key --window " +
            windowID +
            " --delay " +
            config.delay +
            " " +
            key
          );
        }
      }
    }
  }
}

exports.sendKey = sendKey;
