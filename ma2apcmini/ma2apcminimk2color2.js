//ma2apcmini mk2 v 1.5.2 color - by ArtGateOne 
var easymidi = require('easymidi');
var W3CWebSocket = require('websocket')
    .w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:80/'); //U can change localhost(127.0.0.1) to Your console IP address


//config 
wing = 1;   //set wing 1 or 2
pageselect = 1;   //set page select mode - 0-off, 1-only exec buttons , 2-exec buttons and faders
midi_in = 'APC mini mk2';     //set correct midi in device name
midi_out = 'APC mini mk2';    //set correct midi out device name
brightness = 6;     //led brightness 0-6
darkmode = 0;   //new color mode 1 - ON , 0 - OFF
autocolor = 1;  //Executors color from apperance - 0 = off, 1 = ON
blink = 0;      //no color Executor blink 1=on, 0=off 


//global variables
var c1 = 0; //Color executor empty
var c2 = 9; //color executor OFF
var c3 = 21; //color executor ON
var f1 = 0; //Color fader button empty
var f2 = 5; //color fader button OFF
var f3 = 21; //color fader button ON

if (darkmode === 1) {
    var c1 = 0;
    var c2 = 1;
    var c3 = 21;
    var f1 = 0;
    var f2 = 1;
    var f3 = 5;
}

var channel = brightness;
var m = 0;
var blackout = 0;
var pageIndex = 0;  //button page
var pageIndex2 = 0; //fader page
var request = 0;
var interval_on = 0;
var session = 0;
var ledmatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 41, 45, 0, 0, 0, 0, 0, 29, 0, 0, 0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 5, 0, 13, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var led_isrun = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

var faderValue = [0, 0, 0, 0, 0.002, 0.006, 0.01, 0.014, 0.018, 0.022, 0.026, 0.03, 0.034, 0.038, 0.042, 0.046, 0.05, 0.053, 0.057, 0.061, 0.065, 0.069, 0.073, 0.077, 0.081, 0.085, 0.089, 0.093, 0.097, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12, 0.124, 0.128, 0.132, 0.136, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6, 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1, 1];
var faderValueMem = [0, 0, 0];
var faderTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const NS_PER_SEC = 1e9;


if (wing == 1) {
    faderValueMem[56] = 1;
    var buttons = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 175, 176, 177, 178, 179, 180, 181, 182, 160, 161, 162, 163, 164, 165, 166, 167, 145, 146, 147, 148, 149, 150, 151, 152, 130, 131, 132, 133, 134, 135, 136, 137, 115, 116, 117, 118, 119, 120, 121, 122, 100, 101, 102, 103, 104, 105, 106, 107];
} else if (wing == 2) {
    var buttons = [7, 8, 9, 10, 11, 12, 13, 14, 7, 8, 9, 10, 11, 12, 13, 14, 182, 183, 184, 185, 186, 187, 188, 189, 167, 168, 169, 170, 171, 172, 173, 174, 152, 153, 154, 155, 156, 157, 158, 159, 137, 138, 139, 140, 141, 142, 143, 144, 122, 123, 124, 125, 126, 127, 128, 129, 107, 108, 109, 110, 111, 112, 113, 114];
}

for (i = 48; i <= 56; i++) { //fader time set
    faderTime[i] = process.hrtime();
}

//sleep function
function sleep(time, callback) {
    var stop = new Date()
        .getTime();
    while (new Date()
        .getTime() < stop + time) {
        ;
    }
    callback();
}


//interval send data to server function
function interval() {
    if (session > 0) {
        if (wing == 1) {
            client.send('{"requestType":"playbacks","startIndex":[100],"itemsCount":[90],"pageIndex":' + pageIndex + ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[0],"itemsCount":[10],"pageIndex":' + pageIndex2 + ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
        }
        else if (wing == 2) {
            client.send('{"requestType":"playbacks","startIndex":[100],"itemsCount":[90],"pageIndex":' + pageIndex + ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[0],"itemsCount":[15],"pageIndex":' + pageIndex2 + ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
        }
    }
}


//midi clear function
function midiclear() {
    for (i = 0; i < 120; i++) {
        ledmatrix[i] = 0;
        output.send('noteon', { note: i, velocity: 0, channel: 0 });
        sleep(10, function () { });
    }
    return;
}


//clear terminal
//console.log('\033[2J');

//display info
console.log("Akai APC mini MA2 WING " + wing);
console.log(" ");

//display all midi devices
console.log("Midi IN");
console.log(easymidi.getInputs());
console.log("Midi OUT");
console.log(easymidi.getOutputs());

console.log(" ");

console.log("Connecting to midi device " + midi_in);

//open midi device
var input = new easymidi.Input(midi_in);
var output = new easymidi.Output(midi_out);

//sleep 1000
sleep(1000, function () {
    // executes after one second, and blocks the thread
});


//clear led matrix and led status - display .2 
for (i = 100; i < 120; i++) {
    output.send('noteon', { note: i, velocity: 0, channel: 0 });
}


for (i = 0; i < 90; i++) {
    output.send('noteon', { note: i, velocity: ledmatrix[i], channel: 7 });
    sleep(10, function () { });
}


//turn on page select buttons
if (pageselect > 0) {
    output.send('noteon', { note: 112, velocity: 127, channel: 0 });
    output.send('noteon', { note: 113, velocity: 0, channel: 0 });
    output.send('noteon', { note: 114, velocity: 0, channel: 0 });
    output.send('noteon', { note: 115, velocity: 0, channel: 0 });
    output.send('noteon', { note: 116, velocity: 0, channel: 0 });
    output.send('noteon', { note: 117, velocity: 0, channel: 0 });
    output.send('noteon', { note: 118, velocity: 0, channel: 0 });
    output.send('noteon', { note: 119, velocity: 0, channel: 0 });
}



//input.on('noteon', msg => console.log('noteon', msg.note, msg.velocity, msg.channel));
input.on('noteon', function (msg) {

    if (msg.note >= 0 && msg.note <= 15) {

        if (msg.note < 8) {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":1,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
        } else {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":2,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');

        }
    }

    if (msg.note >= 16 && msg.note <= 63) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note >= 100 && msg.note <= 107) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note - 100] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note >= 112 && msg.note <= 119) {//page select
        if (pageselect == 1) {
            output.send('noteon', { note: (pageIndex + 112), velocity: 0, channel: 0 });
            pageIndex = msg.note - 112;
            output.send('noteon', { note: (msg.note), velocity: 127, channel: 0 });
        }
        if (pageselect == 2) {
            output.send('noteon', { note: (pageIndex + 112), velocity: 0, channel: 0 });
            pageIndex = msg.note - 112;
            pageIndex2 = msg.note - 112;
            output.send('noteon', { note: (msg.note), velocity: 127, channel: 0 });
        }

    }



    if (msg.note == 122) {//Shift Button
        if (wing == 1 || wing == 3) {
            client.send('{"command":"SpecialMaster 2.1 At 0","session":' + session + ',"requestType":"command","maxRequests":0}');
            blackout = 1;
        } else if (wing == 2) {
            client.send('{"command":"Learn SpecialMaster 3.1","session":' + session + ',"requestType":"command","maxRequests":0}');
        }
    }


});


input.on('noteoff', function (msg) {

    if (msg.note >= 0 && msg.note <= 15) {

        if (msg.note < 8) {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":1,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
        } else {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":2,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');

        }
    }

    if (msg.note >= 16 && msg.note <= 63) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex + ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note >= 100 && msg.note <= 107) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note - 100] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note == 122) {//Shift Button
        if (wing == 1 || wing == 3) {
            client.send('{"command":"SpecialMaster 2.1 At ' + faderValueMem[56] * 100 + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            blackout = 0;
        }
    }
});

input.on('cc', function (msg) {
    diff = process.hrtime(faderTime[msg.controller]);
    if ((diff[0] * NS_PER_SEC + diff[1]) >= 50000000 | msg.value == 0 | msg.value == 127) {

        faderTime[msg.controller] = process.hrtime();

        faderValueMem[msg.controller] = faderValue[msg.value];

        if (msg.controller == 56) {
            if (wing == 1 || wing == 3) {
                if (blackout == 0) { client.send('{"command":"SpecialMaster 2.1 At ' + (faderValue[msg.value] * 100) + '","session":' + session + ',"requestType":"command","maxRequests":0}'); }
            }
            else if (wing == 2) { client.send('{"command":"SpecialMaster 3.1 At ' + (faderValue[msg.value] * 225) + '","session":' + session + ',"requestType":"command","maxRequests":0}'); }
        } else {
            client.send('{"requestType":"playbacks_userInput","execIndex":' + buttons[msg.controller - 48] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
        }
    }
});




console.log("Connecting to grandMA2 ...");
//WEBSOCKET-------------------
client.onerror = function () {
    console.log('Connection Error');
};

client.onopen = function () {
    console.log('WebSocket Client Connected');
};

client.onclose = function () {
    console.log('Client Closed');
    for (i = 0; i < 119; i++) {
        output.send('noteon', { note: i, velocity: 0, channel: 0 });
        sleep(10, function () { });
    }
    input.close();
    output.close();
    process.exit();
};

client.onmessage = function (e) {

    request = request + 1;

    if (request >= 9) {
        client.send('{"session":' + session + '}');
        client.send('{"requestType":"getdata","data":"set,clear,solo,high","session":' + session + ',"maxRequests":1}');
        request = 0;
    }

    if (typeof e.data === 'string') {

        obj = JSON.parse(e.data);

        if (obj.status == "server ready") {
            console.log("SERVER READY");
            client.send('{"session":0}')
        }
        if (obj.forceLogin == true) {
            console.log("LOGIN ...");
            session = (obj.session);
            client.send('{"requestType":"login","username":"apcmini","password":"2c18e486683a3db1e645ad8523223b72","session":' + session + ',"maxRequests":10}')
        }

        if (obj.session == 0) {
            console.log("CONNECTION ERROR");
            client.send('{"session":' + session + '}');
        }

        if (obj.session) {
            if (obj.session == -1) {
                console.log("Please turn on Web Remote, and set Web Remote password to \"remote\"");
                midiclear();
                input.close();
                output.close();
                process.exit();
            } else {
                session = (obj.session);
            }
        }

        if (obj.text) {
            console.log(obj.text);
            text = obj.text;
        }

        if (obj.responseType == "login" && obj.result == true) {
            if (interval_on == 0) {
                interval_on = 1;
                setInterval(interval, 100);//80
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

            if (obj.responseSubType == 3) {//Button LED
                if (wing == 1) {
                    var j = 56;
                    var l = 0;
                    for (k = 0; k < 6; k++) {

                        for (i = 0; i < 5; i++) {
                            led_feedback(i, j, l);
                            j++;
                        }
                        l++;
                        for (i = 0; i < 3; i++) {
                            led_feedback(i, j, l);
                            j++;
                        }
                        l = l + 2;
                        j = j - 16;
                    }
                } else if (wing == 2) {
                    var j = 56;
                    var l = 1;
                    for (k = 0; k < 6; k++) {

                        for (i = 2; i < 5; i++) {
                            led_feedback(i, j, l);
                            j++;
                        }
                        l++;
                        for (i = 0; i < 5; i++) {
                            led_feedback(i, j, l);
                            j++;
                        }
                        l = l + 2;
                        j = j - 16;
                    }
                } 
            }

            if (obj.responseSubType == 2) {//Fader LED
                if (wing == 1) {
                    j = 0;
                    l = 0;
                    for (var i = 0; i < 5; i++) {
                        led_feedback(i, j, l);
                        j++;
                    }
                    l++;
                    for (var i = 0; i < 3; i++) {
                        led_feedback(i, j, l);
                        j++;
                    }
                } else if (wing == 2) {
                    j = 0;
                    l = 1;
                    for (var i = 2; i < 5; i++) {
                        led_feedback(i, j, l);
                        j++;
                    }
                    l++;
                    for (var i = 0; i < 5; i++) {
                        led_feedback(i, j, l);
                        j++;
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
            m = getClosestVelocity((obj.itemGroups[0].items[l][i].bdC));
            channel = 8;
        } else if ((obj.itemGroups[0].items[l][i].bdC) == "#3D3D3D") {
            m = c1;
        } else {
            m = getClosestVelocity((obj.itemGroups[0].items[l][i].bdC));
        }

        if (ledmatrix[j] != m || led_isrun[j] != channel) {
            led_isrun[j] = channel;
            ledmatrix[j] = m;
            output.send('noteon', { note: j, velocity: m, channel: channel });
        }

    } else {
        m = c1;
        if (obj.itemGroups[0].items[l][i].isRun == 1) {
            m = c3;
        } else if ((obj.itemGroups[0].items[l][i].bdC) == "#3D3D3D") {
            m = c1
        } else {
            m = c2;
        }
        if (blink == 0) {
            channel = brightness;
        } else if (blink == 1) {
            channel = 9;
        }


        if (ledmatrix[j] != m) {
            ledmatrix[j] = m;
            output.send('noteon', { note: j, velocity: m, channel: channel });
        }
    }
    return;
}

// Mapa kolorów do velocity
const colorToVelocity = {
    '#000000': 0, '#1E1E1E': 1, '#7F7F7F': 2, '#FFFFFF': 3,
    '#FF4C4C': 4, '#FF0000': 5, '#590000': 6, '#190000': 7,
    '#FFBD6C': 8, '#FF5400': 9, '#591D00': 10, '#271B00': 11,
    '#FFFF4C': 12, '#FFFF00': 13, '#595900': 14, '#191900': 15,
    '#88FF4C': 16, '#54FF00': 17, '#1D5900': 18, '#142B00': 19,
    '#4CFF4C': 20, '#00FF00': 21, '#005900': 22, '#001900': 23,
    '#4CFF5E': 24, '#00FF19': 25, '#00590D': 26, '#001902': 27,
    '#4CFF88': 28, '#00FF55': 29, '#00591D': 30, '#001F12': 31,
    '#4CFFB7': 32, '#00FF99': 33, '#005935': 34, '#001912': 35,
    '#4CC3FF': 36, '#00A9FF': 37, '#004152': 38, '#001019': 39,
    '#4C88FF': 40, '#0055FF': 41, '#001D59': 42, '#000819': 43,
    '#4C4CFF': 44, '#0000FF': 45, '#000059': 46, '#000019': 47,
    '#874CFF': 48, '#5400FF': 49, '#190064': 50, '#0F0030': 51,
    '#FF4CFF': 52, '#FF00FF': 53, '#590059': 54, '#190019': 55,
    '#FF4C87': 56, '#FF0054': 57, '#59001D': 58, '#220013': 59,
    '#FF1500': 60, '#993500': 61, '#795100': 62, '#436400': 63,
    '#033900': 64, '#005735': 65, '#00547F': 66, '#0000FF': 67,
    '#00454F': 68, '#2500CC': 69, '#7F7F7F': 70, '#202020': 71,
    '#FF0000': 72, '#BDFF2D': 73, '#AFED06': 74, '#64FF09': 75,
    '#108B00': 76, '#00FF87': 77, '#00A9FF': 78, '#002AFF': 79,
    '#3F00FF': 80, '#7A00FF': 81, '#B21A7D': 82, '#402100': 83,
    '#FF4A00': 84, '#88E106': 85, '#72FF15': 86, '#00FF00': 87,
    '#3BFF26': 88, '#59FF71': 89, '#38FFCC': 90, '#5B8AFF': 91,
    '#3151C6': 92, '#877FE9': 93, '#D31DFF': 94, '#FF005D': 95,
    '#FF7F00': 96, '#B9B000': 97, '#90FF00': 98, '#835D07': 99,
    '#392b00': 100, '#144C10': 101, '#0D5038': 102, '#15152A': 103,
    '#16205A': 104, '#693C1C': 105, '#A8000A': 106, '#DE513D': 107,
    '#D86A1C': 108, '#FFE126': 109, '#9EE12F': 110, '#67B50F': 111,
    '#1E1E30': 112, '#DCFF6B': 113, '#80FFBD': 114, '#9A99FF': 115,
    '#8E66FF': 116, '#404040': 117, '#757575': 118, '#E0FFFF': 119,
    '#A00000': 120, '#350000': 121, '#1AD000': 122, '#074200': 123,
    '#B9B000': 124, '#3F3100': 125, '#B35F00': 126, '#4B1502': 127
};

// Funkcja konwertująca kolor z heksadecymalnego na wartości RGB z walidacją
function hexToRgb(hex) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
        throw new Error('Nieprawidłowy format koloru: ' + hex);
    }
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return { r, g, b };
}

// Funkcja obliczająca odległość Manhattan między dwoma kolorami RGB
function colorDistanceManhattan(color1, color2) {
    return Math.abs(color1.r - color2.r) +
        Math.abs(color1.g - color2.g) +
        Math.abs(color1.b - color2.b);
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
