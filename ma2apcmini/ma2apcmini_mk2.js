//ma2apcmini mk2 v 2.1.2 - by ArtGateOne
var easymidi = require("easymidi");
var W3CWebSocket = require("websocket").w3cwebsocket;
var client = new W3CWebSocket("ws://localhost:80/"); //U can change localhost(127.0.0.1) to Your console IP address

//config
const wing = 1; //set wing 1, 2, or 3
const pageselect = 1; //set page select mode - 0-off, 1-only exec buttons , 2-exec buttons and faders
const control_onpc_page = 1; // change pages onpc 0=off, 1=on
const midi_in = "APC mini mk2"; //set correct midi in device name
const midi_out = "APC mini mk2"; //set correct midi out device name
const brightness = 6; //led brightness 0-6 (work in autocolor = 0)
const color_scheme = 0; //color scheme - 0 = Default(AmberGreen) , 1 - dark (GrayGreen), 2 = extra (BlueRed)
const autocolor = 3; //excutors color from apperance - 0 = off, 1 = ON, 2 = ON (full color from apperance - no brighness), 3 MIX - 2color + Autocolor (full color)
const blink = 0; //no color Executor blink 1=on, 0=off (work in autocolor = 0)

//global variables
var c1 = 0; //Color executor empty
var c2 = 9; //color executor OFF
var c3 = 21; //color executor ON
var f1 = 0; //Fader empty
var f2 = 9; //fadere off
var f3 = 5;  //fader on
var fx = 8; //blink channel
let c1_hex = "#000000";
let c2_hex = "#FF5400";
let c3_hex = "#00FF00";

if (color_scheme === 1) {
  c1 = 0;
  c2 = 1;
  c3 = 21;
  //f1 = 0;
  //f2 = 1;
  //f3 = 21;
  c1_hex = "#000000";
  c2_hex = "#0F0F0F";
  c3_hex = "#00FF00";
} else if (color_scheme === 2) {
  c1 = 0;
  c2 = 45;
  c3 = 5;
  //f1 = 0;
  //f2 = 1;
  //f3 = 5;
  c1_hex = "#000000";
  c2_hex = "#0000FF";
  c3_hex = "#FF0000";
}

var channel = brightness;
var m = 0;
var blackout = 0;
var combined = 0;
var pageIndex = 0; //button page
var pageIndex2 = 0; //fader page
var request = 0;
var interval_on = 0;
var session = 0;
var ledmatrix = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
  0, 1, 1, 0, 1, 1, 0, 5, 0, 1, 0, 0, 0, 1, 0, 5, 0, 1, 1, 0, 1, 1, 0, 5, 0, 0,
  1, 0, 0, 1, 0, 5, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0,
];

if (wing == 2) {
  ledmatrix = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 5, 5, 0, 1, 1, 0, 1, 0, 5, 0, 0, 0, 1, 0, 1, 0, 5, 5, 0, 1, 1, 0, 1,
    0, 0, 5, 0, 0, 1, 0, 1, 0, 5, 5, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ];
} else if (wing == 3) {
  ledmatrix = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 1, 1, 0, 5, 5, 0, 1, 0, 1, 0, 0, 0, 5, 0, 1, 0, 1, 1, 0, 5, 5, 0, 1,
    0, 0, 1, 0, 0, 5, 0, 1, 0, 1, 1, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ];
}

var led_isrun = [
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2,
];

var faderValue = [
  0, 0, 0, 0, 0.002, 0.006, 0.01, 0.014, 0.018, 0.022, 0.026, 0.03, 0.034,
  0.038, 0.042, 0.046, 0.05, 0.053, 0.057, 0.061, 0.065, 0.069, 0.073, 0.077,
  0.081, 0.085, 0.089, 0.093, 0.097, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12,
  0.124, 0.128, 0.132, 0.136, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21,
  0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34,
  0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47,
  0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6,
  0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73,
  0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86,
  0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99,
  1, 1, 1,
];
var faderValueMem = [0, 0, 0];
var faderTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const NS_PER_SEC = 1e9;

const midiMatrix = Array.from({ length: 6 }, () =>
  Array(15)
    .fill()
    .map(() => ({ color: "#000000", isRun: false }))
);

if (wing == 1) {
  faderValueMem[56] = 1;
  var buttons = [
    0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 175, 176, 177, 178, 179,
    180, 181, 182, 160, 161, 162, 163, 164, 165, 166, 167, 145, 146, 147, 148,
    149, 150, 151, 152, 130, 131, 132, 133, 134, 135, 136, 137, 115, 116, 117,
    118, 119, 120, 121, 122, 100, 101, 102, 103, 104, 105, 106, 107,
  ];
} else if (wing == 2) {
  var buttons = [
    7, 8, 9, 10, 11, 12, 13, 14, 7, 8, 9, 10, 11, 12, 13, 14, 182, 183, 184,
    185, 186, 187, 188, 189, 167, 168, 169, 170, 171, 172, 173, 174, 152, 153,
    154, 155, 156, 157, 158, 159, 137, 138, 139, 140, 141, 142, 143, 144, 122,
    123, 124, 125, 126, 127, 128, 129, 107, 108, 109, 110, 111, 112, 113, 114,
  ];
} else if (wing == 3) {
  faderValueMem[56] = 0;
  var buttons = [
    170, 171, 172, 173, 174, 175, 176, 177, 160, 161, 162, 163, 164, 165, 166,
    167, 150, 151, 152, 153, 154, 155, 156, 157, 140, 141, 142, 143, 144, 145,
    146, 147, 130, 131, 132, 133, 134, 135, 136, 137, 120, 121, 122, 123, 124,
    125, 126, 127, 110, 111, 112, 113, 114, 115, 116, 117, 100, 101, 102, 103,
    104, 105, 106, 107,
  ];
}

for (i = 48; i <= 56; i++) {
  //fader time set
  faderTime[i] = process.hrtime();
}

//sleep function
function sleep(time, callback) {
  var stop = new Date().getTime();
  while (new Date().getTime() < stop + time) {}
  callback();
}

//interval send data to server function
function interval() {
  if (session > 0) {
    if (wing == 1 || wing == 3) {
      client.send(
        '{"requestType":"playbacks","startIndex":[100],"itemsCount":[90],"pageIndex":' +
          pageIndex +
          ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
      client.send(
        '{"requestType":"playbacks","startIndex":[0],"itemsCount":[10],"pageIndex":' +
          pageIndex2 +
          ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
    } else if (wing == 2) {
      client.send(
        '{"requestType":"playbacks","startIndex":[100],"itemsCount":[90],"pageIndex":' +
          pageIndex +
          ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
      client.send(
        '{"requestType":"playbacks","startIndex":[0],"itemsCount":[15],"pageIndex":' +
          pageIndex2 +
          ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
    }
  }
}

//midi clear function
function midiclear() {
  for (i = 0; i < 120; i++) {
    ledmatrix[i] = 0;
    output.send("noteon", { note: i, velocity: 0, channel: 0 });
    sleep(10, function () {});
  }
  return;
}

//clear terminal
//console.log('\033[2J');

//display info
console.log("Akai APC mini MA2 WING " + wing + " mode");
console.log(" ");

//display all midi devices
console.log("Midi IN");
console.log(easymidi.getInputs());
console.log("Midi OUT");
console.log(easymidi.getOutputs());

console.log(" ");

console.log("Connecting to midi device " + midi_in);

console.log(" ");

const availableInputs = easymidi.getInputs();
const availableOutputs = easymidi.getOutputs();

if (!availableInputs.includes(midi_in)) {
  console.error(
    `❌ MIDI IN "${midi_in}" nie znaleziony. Dostępne:`,
    availableInputs
  );
  process.exit(1);
}

if (!availableOutputs.includes(midi_out)) {
  console.error(
    `❌ MIDI OUT "${midiName}" nie znaleziony. Dostępne:`,
    availableInputs
  );
  process.exit(1);
}

//open midi device
var input = new easymidi.Input(midi_in);
var output = new easymidi.Output(midi_out);

//sleep 1000
sleep(1000, function () {
  // executes after one second, and blocks the thread
});

//clear led matrix and led status - display .2
for (i = 100; i < 120; i++) {
  output.send("noteon", { note: i, velocity: 0, channel: 0 });
}

for (i = 0; i < 90; i++) {
  output.send("noteon", {
    note: i,
    velocity: ledmatrix[i],
    channel: brightness,
  });
  sleep(10, function () {});
}

//turn on page select buttons
if (pageselect > 0) {
  output.send("noteon", { note: 112, velocity: 127, channel: 0 });
  output.send("noteon", { note: 113, velocity: 0, channel: 0 });
  output.send("noteon", { note: 114, velocity: 0, channel: 0 });
  output.send("noteon", { note: 115, velocity: 0, channel: 0 });
  output.send("noteon", { note: 116, velocity: 0, channel: 0 });
  output.send("noteon", { note: 117, velocity: 0, channel: 0 });
  output.send("noteon", { note: 118, velocity: 0, channel: 0 });
  output.send("noteon", { note: 119, velocity: 0, channel: 0 });
}

//input.on('noteon', msg => console.log('noteon', msg.note, msg.velocity, msg.channel));
input.on("noteon", function (msg) {
  if (msg.note >= 0 && msg.note <= 15) {
    if (wing == 3) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note] +
          ',"pageIndex":' +
          pageIndex +
          ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else if (msg.note < 8) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note] +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":1,"pressed":true,"released":false,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note] +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":2,"pressed":true,"released":false,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }

  if (msg.note >= 16 && msg.note <= 63) {
    client.send(
      '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
        buttons[msg.note] +
        ',"pageIndex":' +
        pageIndex +
        ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' +
        session +
        ',"maxRequests":0}'
    );
  }

  if (msg.note >= 100 && msg.note <= 107) {
    if (wing == 3) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          (msg.note - 100) +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note - 100] +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }

  if (msg.note >= 112 && msg.note <= 119) {
    //page select
    if (pageselect == 1) {
      output.send("noteon", { note: pageIndex + 112, velocity: 0, channel: 0 });
      pageIndex = msg.note - 112;
      output.send("noteon", { note: msg.note, velocity: 127, channel: 0 });
      if (control_onpc_page == 1) {
        client.send(
          '{"command":"ButtonPage ' +
            (pageIndex + 1) +
            '","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      }
    }
    if (pageselect == 2) {
      output.send("noteon", { note: pageIndex + 112, velocity: 0, channel: 0 });
      pageIndex = msg.note - 112;
      pageIndex2 = msg.note - 112;
      output.send("noteon", { note: msg.note, velocity: 127, channel: 0 });
      if (control_onpc_page == 1) {
        client.send(
          '{"command":"Page ' +
            (pageIndex + 1) +
            '","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      }
    }
  }

  if (msg.note == 122) {
    //Shift Button
    if (wing == 1) {
      client.send(
        '{"command":"SpecialMaster 2.1 At 0","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
      blackout = 1;
    } else if (wing == 2) {
      client.send(
        '{"command":"Learn SpecialMaster 3.1","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    } else if (wing == 3) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":"8","pageIndex":' +
          pageIndex2 +
          ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }
});

input.on("noteoff", function (msg) {
  if (msg.note >= 0 && msg.note <= 15) {
    if (wing == 3) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note] +
          ',"pageIndex":' +
          pageIndex +
          ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else if (msg.note < 8) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note] +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":1,"pressed":false,"released":true,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note] +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":2,"pressed":false,"released":true,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }

  if (msg.note >= 16 && msg.note <= 63) {
    client.send(
      '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
        buttons[msg.note] +
        ',"pageIndex":' +
        pageIndex +
        ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' +
        session +
        ',"maxRequests":0}'
    );
  }

  if (msg.note >= 100 && msg.note <= 107) {
    if (wing == 3) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          (msg.note - 100) +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":' +
          buttons[msg.note - 100] +
          ',"pageIndex":' +
          pageIndex2 +
          ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }

  if (msg.note == 122) {
    //Shift Button
    if (wing == 1) {
      client.send(
        '{"command":"SpecialMaster 2.1 At ' +
          faderValueMem[56] * 100 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
      blackout = 0;
    } else if (wing == 3) {
      client.send(
        '{"requestType":"playbacks_userInput","cmdline":"","execIndex":"8","pageIndex":' +
          pageIndex2 +
          ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }
});

input.on("cc", function (msg) {
  diff = process.hrtime(faderTime[msg.controller]);
  if (
    (diff[0] * NS_PER_SEC + diff[1] >= 50000000) |
    (msg.value == 0) |
    (msg.value == 127)
  ) {
    faderTime[msg.controller] = process.hrtime();

    faderValueMem[msg.controller] = faderValue[msg.value];

    if (msg.controller == 56) {
      if (wing == 1) {
        if (blackout == 0) {
          client.send(
            '{"command":"SpecialMaster 2.1 At ' +
              faderValue[msg.value] * 100 +
              '","session":' +
              session +
              ',"requestType":"command","maxRequests":0}'
          );
        }
      } else if (wing == 2) {
        client.send(
          '{"command":"SpecialMaster 3.1 At ' +
            faderValue[msg.value] * 225 +
            '","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      } else if (wing == 3) {
        client.send(
          '{"requestType":"playbacks_userInput","execIndex":"8","pageIndex":' +
            pageIndex2 +
            ',"faderValue":' +
            faderValue[msg.value] +
            ',"type":1,"session":' +
            session +
            ',"maxRequests":0}'
        );
      }
    } else {
      if (wing == 3) {
        client.send(
          '{"requestType":"playbacks_userInput","execIndex":' +
            (msg.controller - 48) +
            ',"pageIndex":' +
            pageIndex2 +
            ',"faderValue":' +
            faderValue[msg.value] +
            ',"type":1,"session":' +
            session +
            ',"maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"playbacks_userInput","execIndex":' +
            buttons[msg.controller - 48] +
            ',"pageIndex":' +
            pageIndex2 +
            ',"faderValue":' +
            faderValue[msg.value] +
            ',"type":1,"session":' +
            session +
            ',"maxRequests":0}'
        );
      }
    }
  }
});

console.log("Connecting to grandMA2 ...");
//WEBSOCKET-------------------
client.onerror = function () {
  console.log("Connection Error");
};

client.onopen = function () {
  console.log("WebSocket Client Connected");
};

client.onclose = function () {
  console.log("Client Closed");
  for (i = 0; i < 119; i++) {
    output.send("noteon", { note: i, velocity: 0, channel: 0 });
    sleep(10, function () {});
  }
  input.close();
  output.close();
  process.exit();
};

client.onmessage = function (e) {
  if (request >= 9) {
    client.send('{"session":' + session + "}");
    client.send(
      '{"requestType":"getdata","data":"set,clear,solo,high","session":' +
        session +
        ',"maxRequests":1}'
    );
    request = 0;
  }

  if (typeof e.data === "string") {
    obj = JSON.parse(e.data);

    if (obj.status == "server ready") {
      console.log("SERVER READY");
      client.send('{"session":0}');
    }
    if (obj.forceLogin == true) {
      console.log("LOGIN ...");
      session = obj.session;
      client.send(
        '{"requestType":"login","username":"apcmini","password":"2c18e486683a3db1e645ad8523223b72","session":' +
          session +
          ',"maxRequests":10}'
      );
    }

    if (obj.session == 0) {
      console.log("CONNECTION ERROR");
      client.send('{"session":' + session + "}");
    }

    if (obj.session) {
      if (obj.session == -1) {
        console.log(
          'Please run MA2, enable Remote Login , and add user "apcmini", password "remote"'
        );
        midiclear();
        input.close();
        output.close();
        process.exit();
      } else {
        session = obj.session;
      }
    }

    if (obj.text) {
      console.log(obj.text);
      text = obj.text;
    }

    if (obj.responseType == "login" && obj.result == true) {
      if (interval_on == 0) {
        interval_on = 1;
        setInterval(interval, 100); //80
      }
      console.log("...LOGGED");
      console.log("SESSION " + session);
    }

    if (obj.responseType == "login" && obj.result == false) {
      console.log("...LOGIN ERROR");
      console.log("SESSION " + session);
    }

    if (obj.responseType == "presetTypeList") {
      //console.log("Preset Type List");
    }

    if (obj.responseType == "presetTypes") {
      //console.log("Preset Types");
    }

    if (obj.responseType == "getdata") {
      //console.log("Get Data");
    }

    if (obj.responseType == "playbacks") {
      request = request + 1;

      if (obj.responseSubType == 3) {
        if (wing == 1 || wing == 2) {
          const matrix = buildMatrix(obj);
          //drawMatrixAscii(matrix);
          //drawMatrixAsciiColors(matrix);
          //drawMatrixColorBlocks(matrix);
          syncMidiFromMatrix(matrix, midiMatrix, wing);
        }

        //Button LED
        else if (wing == 3) {
          var j = 56;
          var l = 0;

          for (var kk = 0; kk < 8; kk++) {
            var i = 0;
            var jj = j + 5;
            while (j < jj) {
              combined = obj.itemGroups[0].items[l][i].combinedItems;
              for (var comb = 0; comb < combined; comb++) {
                led_feedback(i, j, l);
                j++;
              }
              i++;
            }
            l = l + 2;
            j = j - 13;
          }

          l = 1;
          j = 61;
          for (var kk = 0; kk < 8; kk++) {
            var i = 0;
            var jj = j + 3;
            while (j < jj) {
              combined = obj.itemGroups[0].items[l][i].combinedItems;
              for (var comb = 0; comb < combined; comb++) {
                if (j < jj) {
                  led_feedback(i, j, l);
                  j++;
                }
              }
              i++;
            }
            l = l + 2;
            j = j - 11;
          }
        }
      }

      if (obj.responseSubType == 2) {
        //Fader LED
        if (wing == 1) {
          var j = 0;
          var l = 0;
          var i = 0;
          var jj = j + 5;
          while (j < jj) {
            combined = obj.itemGroups[0].items[l][i].combinedItems;
            for (var comb = 0; comb < combined; comb++) {
              led_feedback(i, j, l);
              j++;
            }
            i++;
          }
          l = 1;
          j = 5;

          var i = 0;
          var jj = j + 3;
          while (j < jj) {
            combined = obj.itemGroups[0].items[l][i].combinedItems;
            for (var comb = 0; comb < combined; comb++) {
              if (j < jj) {
                led_feedback(i, j, l);
                j++;
              }
            }
            i++;
          }
        } else if (wing == 2) {
          var j = -2;
          var l = 1;
          var i = 0;
          var jj = j + 5;
          while (j < jj) {
            combined = obj.itemGroups[0].items[l][i].combinedItems;
            for (var comb = 0; comb < combined; comb++) {
              if (j >= 0) {
                led_feedback(i, j, l);
              }
              j++;
            }
            i++;
          }
          l = 2;
          j = 3;
          for (var kk = 0; kk < 1; kk++) {
            var i = 0;
            var jj = j + 5;
            while (j < jj) {
              combined = obj.itemGroups[0].items[l][i].combinedItems;
              for (var comb = 0; comb < combined; comb++) {
                led_feedback(i, j, l);
                j++;
              }
              i++;
            }
          }
        } else if (wing == 3) {
          var j = 0;
          var l = 0;
          var i = 0;
          var jj = j + 5;
          while (j < jj) {
            combined = obj.itemGroups[0].items[l][i].combinedItems;
            for (var comb = 0; comb < combined; comb++) {
              if (obj.itemGroups[0].items[l][i].isRun == 1) {
                output.send("noteon", {
                  note: j + 100,
                  velocity: 1,
                  channel: 0,
                });
              } else {
                output.send("noteon", {
                  note: j + 100,
                  velocity: 0,
                  channel: 0,
                });
              }
              j++;
            }
            i++;
          }
          l = 1;
          j = 5;

          var i = 0;
          var jj = j + 3;
          while (j < jj) {
            combined = obj.itemGroups[0].items[l][i].combinedItems;
            for (var comb = 0; comb < combined; comb++) {
              if (j < jj) {
                if (obj.itemGroups[0].items[l][i].isRun == 1) {
                  output.send("noteon", {
                    note: j + 100,
                    velocity: 1,
                    channel: 0,
                  });
                } else {
                  output.send("noteon", {
                    note: j + 100,
                    velocity: 0,
                    channel: 0,
                  });
                }
                j++;
              }
            }
            i++;
          }
        }
      }
    }
  }
};

function led_feedback(i, j, l) {
  if (autocolor == 1) {
    m = c1;
    channel = brightness;

    if (obj.itemGroups[0].items[l][i].isRun == 1) {
      m = getClosestVelocity(obj.itemGroups[0].items[l][i].bdC);
      channel = fx;
    } else if (obj.itemGroups[0].items[l][i].bdC == "#3D3D3D") {
      m = c1;
    } else {
      m = getClosestVelocity(obj.itemGroups[0].items[l][i].bdC);
    }

    if (ledmatrix[j] != m || led_isrun[j] != channel) {
      led_isrun[j] = channel;
      ledmatrix[j] = m;
      output.send("noteon", { note: j, velocity: m, channel: channel });
    }
  } else if (autocolor == 2) {
    m = obj.itemGroups[0].items[l][i].isRun;
    if (ledmatrix[j + 100] != m) {
      ledmatrix[j + 100] = m;
      output.send("noteon", {
        note: j + 100,
        velocity: obj.itemGroups[0].items[l][i].isRun,
        channel: 0,
      });
    }
    m = obj.itemGroups[0].items[l][i].bdC;
    if (ledmatrix[j] != m) {
      ledmatrix[j] = m;
      setPadColorHEX(output, j, obj.itemGroups[0].items[l][i].bdC);
    }
  } else if (autocolor === 3) {
    m = c1;
    channel = brightness;
    if (
      obj.itemGroups[0].items[l][i].bdC == "#3D3D3D" ||
      obj.itemGroups[0].items[l][i].bdC == "#FFFF80"
    ) {
      if (obj.itemGroups[0].items[l][i].isRun == 1) {
        m = c3;
        if (blink) {
          channel = fx;
        }
      } else if (obj.itemGroups[0].items[l][i].bdC == "#FFFF80") {
        m = c2;
      } else {
        m = c1;
      }

      if (ledmatrix[j] != m || led_isrun[j] != channel) {
        led_isrun[j] = channel;
        ledmatrix[j] = m;
        output.send("noteon", { note: j, velocity: m, channel: channel });
      }
    } else {
      if (obj.itemGroups[0].items[l][i].isRun == 1) {
        m = getClosestVelocity(obj.itemGroups[0].items[l][i].bdC);
        channel = fx;
      } else if (obj.itemGroups[0].items[l][i].bdC == "#3D3D3D") {
        m = c1;
      } else {
        m = getClosestVelocity(obj.itemGroups[0].items[l][i].bdC);
      }

      if (ledmatrix[j] != m || led_isrun[j] != channel) {
        led_isrun[j] = channel;
        ledmatrix[j] = m;
        output.send("noteon", { note: j, velocity: m, channel: channel });
      }
    }

    /*
    if (isRun) {
          let adjustedColor = adjustHexBrightness(color, request);
          if (color == "#FFFF80") {
            if (blink) {
              adjustedColor = adjustHexBrightness(c3_hex, request);
            } else {
              adjustedColor = adjustHexBrightness(c3_hex, brightness);
            }
          }
          setPadColorHEX(output, note, adjustedColor);
        } else {
          if (color == "#FFFF80") {
            setPadColorHEX(output, note, c2_hex);
          } else if (color == "#3D3D3D") {
            setPadColorHEX(output, note, c1_hex);
          } else {
            setPadColorHEX(output, note, color);
          }
        }
          */
  } else {
    m = c1;
    channel = brightness;
    if (obj.itemGroups[0].items[l][i].isRun == 1) {
      m = c3;
      if (blink == 1) {
        channel = fx;
      }
    } else if (obj.itemGroups[0].items[l][i].bdC == "#3D3D3D") {
      m = c1;
    } else {
      m = c2;
    }
    if (ledmatrix[j] != m) {
      ledmatrix[j] = m;
      output.send("noteon", { note: j, velocity: m, channel: channel });
    }
  }
  return;
}

// color map
const colorToVelocity = {
  "#000000": 0,
  "#1E1E1E": 1,
  "#7F7F7F": 2,
  "#FFFFFF": 3,
  "#FF4C4C": 4,
  "#FF0000": 5,
  "#590000": 6,
  "#190000": 7,
  "#FFBD6C": 8,
  "#FF5400": 9,
  "#591D00": 10,
  "#271B00": 11,
  "#FFFF4C": 12,
  "#FFFF00": 13,
  "#595900": 14,
  "#191900": 15,
  "#88FF4C": 16,
  "#54FF00": 17,
  "#1D5900": 18,
  "#142B00": 19,
  "#4CFF4C": 20,
  "#00FF00": 21,
  "#005900": 22,
  "#001900": 23,
  "#4CFF5E": 24,
  "#00FF19": 25,
  "#00590D": 26,
  "#001902": 27,
  "#4CFF88": 28,
  "#00FF55": 29,
  "#00591D": 30,
  "#001F12": 31,
  "#4CFFB7": 32,
  "#00FF99": 33,
  "#005935": 34,
  "#001912": 35,
  "#4CC3FF": 36,
  "#00A9FF": 37,
  "#004152": 38,
  "#001019": 39,
  "#4C88FF": 40,
  "#0055FF": 41,
  "#001D59": 42,
  "#000819": 43,
  "#4C4CFF": 44,
  "#0000FF": 45,
  "#000059": 46,
  "#000019": 47,
  "#874CFF": 48,
  "#5400FF": 49,
  "#190064": 50,
  "#0F0030": 51,
  "#FF4CFF": 52,
  "#FF00FF": 53,
  "#590059": 54,
  "#190019": 55,
  "#FF4C87": 56,
  "#FF0054": 57,
  "#59001D": 58,
  "#220013": 59,
  "#FF1500": 60,
  "#993500": 61,
  "#795100": 62,
  "#436400": 63,
  "#033900": 64,
  "#005735": 65,
  "#00547F": 66,
  "#0000FF": 67,
  "#00454F": 68,
  "#2500CC": 69,
  "#7F7F7F": 70,
  "#202020": 71,
  "#FF0000": 72,
  "#BDFF2D": 73,
  "#AFED06": 74,
  "#64FF09": 75,
  "#108B00": 76,
  "#00FF87": 77,
  "#00A9FF": 78,
  "#002AFF": 79,
  "#3F00FF": 80,
  "#7A00FF": 81,
  "#B21A7D": 82,
  "#402100": 83,
  "#FF4A00": 84,
  "#88E106": 85,
  "#72FF15": 86,
  "#00FF00": 87,
  "#3BFF26": 88,
  "#59FF71": 89,
  "#38FFCC": 90,
  "#5B8AFF": 91,
  "#3151C6": 92,
  "#877FE9": 93,
  "#D31DFF": 94,
  "#FF005D": 95,
  "#FF7F00": 96,
  "#B9B000": 97,
  "#90FF00": 98,
  "#835D07": 99,
  "#392b00": 100,
  "#144C10": 101,
  "#0D5038": 102,
  "#15152A": 103,
  "#16205A": 104,
  "#693C1C": 105,
  "#A8000A": 106,
  "#DE513D": 107,
  "#D86A1C": 108,
  "#FFE126": 109,
  "#9EE12F": 110,
  "#67B50F": 111,
  "#1E1E30": 112,
  "#DCFF6B": 113,
  "#80FFBD": 114,
  "#9A99FF": 115,
  "#8E66FF": 116,
  "#404040": 117,
  "#757575": 118,
  "#E0FFFF": 119,
  "#A00000": 120,
  "#350000": 121,
  "#1AD000": 122,
  "#074200": 123,
  "#B9B000": 124,
  "#3F3100": 125,
  "#B35F00": 126,
  "#4B1502": 127,
  "#3D3D3D": 0,
};

// Funkcja konwertująca kolor z heksadecymalnego na wartości RGB z walidacją
function hexToRgb(hex) {
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
    throw new Error("Nieprawidłowy format koloru: " + hex);
  }
  let bigint = parseInt(hex.slice(1), 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  return { r, g, b };
}

// Funkcja obliczająca odległość Manhattan między dwoma kolorami RGB
function colorDistanceManhattan(color1, color2) {
  return (
    Math.abs(color1.r - color2.r) +
    Math.abs(color1.g - color2.g) +
    Math.abs(color1.b - color2.b)
  );
}

// Funkcja zwracająca velocity dla najbardziej zbliżonego koloru
function getClosestVelocity(color) {
  let targetRgb = hexToRgb(color);
  let closestColor = null;
  let closestDistance = Infinity;

  for (let key in colorToVelocity) {
    let currentRgb = hexToRgb(key);
    let distance = colorDistanceManhattan(targetRgb, currentRgb);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = key;
    }
  }

  return colorToVelocity[closestColor];
}

function buildMatrix(obj) {
  const matrix = Array.from({ length: 6 }, () => Array(15).fill(null));
  const itemGroups = obj?.itemGroups?.[0]?.items;

  if (!Array.isArray(itemGroups)) {
    console.error("❌ Nieprawidłowa struktura danych wejściowych");
    return matrix;
  }

  itemGroups.forEach((rowSet, groupIndex) => {
    if (!Array.isArray(rowSet)) {
      console.warn(`⚠️ Pominięto nie-tablicę w itemGroups[${groupIndex}]`);
      return;
    }

    rowSet.forEach((item, itemIndex) => {
      const width = item?.combinedItems ?? 1;
      const color = item?.bdC ?? "#000000";
      const isRun = item?.isRun === 1;
      const iexec = item?.iExec;

      if (typeof iexec !== "number" || iexec < 100 || iexec > 189) {
        console.warn(`⚠️ Nieprawidłowy executor: ${iexec}`);
        return;
      }

      const index = iexec - 100;
      const rowIndex = Math.floor(index / 15);
      const colIndex = index % 15;

      const blockStart = Math.floor(colIndex / 5) * 5;
      const blockEnd = blockStart + 5;
      const maxFill = blockEnd - colIndex;
      const fillWidth = Math.min(width, maxFill);

      for (let w = 0; w < fillWidth; w++) {
        const targetCol = colIndex + w;
        if (rowIndex >= 6 || targetCol >= 15) {
          console.warn(`⛔ Poza zakresem: row=${rowIndex}, col=${targetCol}`);
          continue;
        }

        matrix[rowIndex][targetCol] = {
          color,
          isRun,
          width,
          origin: w === 0,
        };
      }
    });
  });

  return matrix;
}

function drawMatrixAscii(matrix) {
  console.log("🟩 Status EXEC:\n");

  matrix.forEach((row, rowIndex) => {
    let rowStr = `R${rowIndex}: `;
    row.forEach((cell) => {
      if (!cell || cell.color === "#3D3D3D") {
        rowStr += "⬛ "; // Pusty executor
      } else if (cell.isRun) {
        rowStr += "🟩 "; // EXEC ON
      } else {
        rowStr += "🟨 "; // EXEC OFF
      }
    });
    console.log(rowStr);
  });

  console.log("\n📌 Legenda: 🟩=EXEC ON, 🟨=EXEC OFF, ⬛=EMPTY\n");

  //const emptyCount = matrix.flat().filter(cell => !cell || cell.color === "#3D3D3D").length;
  //console.log(`📊 Liczba pustych executorów: ${emptyCount}`);

  process.stdout.write("\x1Bc");
}

function drawMatrixAsciiColors(matrix) {
  console.log("🎨 Kolory executorów:\n");

  matrix.forEach((row, rowIndex) => {
    let rowStr = `R${rowIndex}: `;
    row.forEach((cell) => {
      const color = cell?.color ?? "null";
      rowStr += `${color} `;
    });
    console.log(rowStr);
  });

  console.log(
    "\n📌 Każdy slot pokazuje swój kolor HEX lub 'null' jeśli pusty\n"
  );

  process.stdout.write("\x1Bc");
}

process.on("uncaughtException", (err) => {
  console.error("💥 Nieobsłużony wyjątek:", err);
  setTimeout(() => process.exit(1), 1000); // daj czas na przeczytanie
});

function drawMatrixColorBlocks(matrix) {
  console.log("🎨 Kolory executorów:\n");

  const colorMap = {
    "#3D3D3D": "⬛", // pusty
    "#00FF00": "🟩", // zielony
    "#FFFF00": "🟨", // żółty
    "#FF0000": "🟥", // czerwony
    "#0000FF": "🟦", // niebieski
    "#FFFFFF": "⬜", // biały
    // dodaj więcej jeśli chcesz
  };

  matrix.forEach((row, rowIndex) => {
    let rowStr = `R${rowIndex}: `;
    row.forEach((cell) => {
      const color = cell?.color ?? "null";
      //const block = colorMap[color] ?? "🎨"; // domyślny symbol dla nieznanych kolorów
      const block = colorMap[color] ?? "🟧"; // domyślny symbol dla nieznanych kolorów
      rowStr += `${block} `;
    });
    console.log(rowStr);
  });

  console.log(
    "\n📌 Legenda: ⬛=#3D3D3D, 🟩=#00FF00, 🟨=#FFFF00, 🟥=#FF0000, 🟦=#0000FF, ⬜=#FFFFFF, 🎨=inny kolor\n"
  );

  process.stdout.write("\x1Bc");
}

function hexToAnsiBlock(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return " ";

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `\x1b[48;2;${r};${g};${b}m \x1b[0m`; // kolor tła
}

function drawMatrixDynamicColors(matrix) {
  console.log("🎨 Kolory executorów:\n");

  matrix.forEach((row, rowIndex) => {
    let rowStr = `R${rowIndex}: `;
    row.forEach((cell) => {
      const hex = cell?.color ?? "#000000";
      rowStr += hexToAnsiBlock(hex);
    });
    console.log(rowStr);
  });

  console.log("\n📌 Każdy blok pokazuje kolor tła zgodny z HEX\n");

  process.stdout.write("\x1Bc");
}

function syncMidiFromMatrix(matrix, midiMatrix, wing = 1) {
  const startCol = wing === 1 ? 0 : 7;
  const endCol = startCol + 8;
  let note = 15;

  for (let row = 5; row >= 0; row--) {
    for (let col = startCol; col < endCol; col++) {
      const cell = matrix[row][col] ?? {};
      const prev = midiMatrix[row][col] ?? {};

      const color = cell.color ?? "#000000";
      const isRun = cell.isRun ?? false;

      const prevColor = prev.color ?? "#000000";
      const prevRun = prev.isRun ?? false;

      note++;

      let velocity;
      let channel = brightness;

      if (autocolor === 0) {
        // Tryb bez kolorów – ręczne przypisanie velocity
        if (color === "#3D3D3D") {
          velocity = c1; // pusty
        } else {
          velocity = isRun ? c3 : c2; // aktywny / wyłączony
        }

        if (blink && isRun) channel = fx;

        output.send("noteon", {
          note,
          velocity,
          channel,
        });
      } else if (autocolor === 1) {
        // Tryb z kolorami – automatyczne przypisanie velocity
        velocity = getClosestVelocity(color);
        if (isRun) channel = fx;
        output.send("noteon", {
          note,
          velocity,
          channel,
        });
      } else if (autocolor === 2) {
        velocity = getClosestVelocity(color);
        if (isRun) {
          const adjustedColor = adjustHexBrightness(color, request);
          setPadColorHEX(output, note, adjustedColor);
        } else {
          setPadColorHEX(output, note, color);
        }
      } else if (autocolor === 3) {
        //velocity = getClosestVelocity(color);
        if (isRun) {
          let adjustedColor = adjustHexBrightness(color, request);
          if (color == "#FFFF80") {
            if (blink) {
              adjustedColor = adjustHexBrightness(c3_hex, request);
            } else {
              adjustedColor = adjustHexBrightness(c3_hex, brightness);
            }
          }
          setPadColorHEX(output, note, adjustedColor);
        } else {
          if (color == "#FFFF80") {
            setPadColorHEX(output, note, c2_hex);
          } else if (color == "#3D3D3D") {
            setPadColorHEX(output, note, c1_hex);
          } else {
            setPadColorHEX(output, note, color);
          }
        }
      }

      // Aktualizacja stanu tylko jeśli coś się zmieniło
      if (color !== prevColor || isRun !== prevRun) {
        midiMatrix[row][col] = { color, isRun };
      }
    }
  }
}

/**
 * Wysyła kolor w formacie HEX na wybrany pad APC mini mk2
 * @param {easymidi.Output} output - obiekt wyjścia MIDI (np. new easymidi.Output(...))
 * @param {number} padIndex - numer pada (0–63 dla matrycy, lub inne note dla przycisków)
 * @param {string} hexColor - kolor w HEX np. "#FF00F0"
 * @param {number} count - ile kolejnych padów pokolorować (domyślnie 1)
 */
function setPadColorHEX(output, padIndex, hexColor, count = 1) {
  const h = hexColor.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) {
    throw new Error(`Nieprawidłowy kod hex: ${hexColor}`);
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  const split7 = (v) => [(v >> 7) & 0x7f, v & 0x7f];

  const [rH, rL] = split7(r);
  const [gH, gL] = split7(g);
  const [bH, bL] = split7(b);

  for (let i = 0; i < count; i++) {
    const idx = padIndex + i;
    output.send("sysex", [
      0xf0,
      0x47,
      0x7f,
      0x4f,
      0x24,
      0x00,
      0x08,
      idx,
      idx,
      rH,
      rL,
      gH,
      gL,
      bH,
      bL,
      0xf7,
    ]);
  }
}

// 🎯 PRZYKŁAD UŻYCIA:
//const out = new easymidi.Output("APC mini mk2"); // lub dokładna nazwa portu
//setPadColorHEX(out, 2, "#FF00F0", 2); // pady 2–3 na magenta
function adjustHexBrightness(hexColor, request) {
  const factor = Math.min(Math.max(request / 9, 0), 1); // skala 0–1

  const h = hexColor.replace(/^#/, "");
  const r = Math.round(parseInt(h.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * factor);

  const toHex = (v) => v.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

process.on("SIGINT", () => {
  interval_on = 0;
  console.log("CTRL+C -> awaryjne wyjście");
  midiclear();
  client.close();
  input.close();
  output.close();
  process.exit(1); // kod błędu
});

process.on("SIGHUP", () => {
  interval_on = 0;
  console.log("CTRL+C -> awaryjne wyjście");
  midiclear();
  client.close();
  input.close();
  output.close();
  process.exit(1); // kod błędu
});

process.on("SIGTERM", () => {
  interval_on = 0;
  console.log("CTRL+C -> awaryjne wyjście");
  midiclear();
  client.close();
  input.close();
  output.close();
  process.exit(1); // kod błędu
});

process.on("uncaughtException", (err) => {
  console.error("Nieobsłużony wyjątek:", err.message);
  // Możesz tu np. spróbować ponownie połączyć z kontrolerem
});
