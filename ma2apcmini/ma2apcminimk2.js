//ma2apcmini mk2 v 1.4.0 by ArtGateOne 
var easymidi = require('easymidi');
var W3CWebSocket = require('websocket')
    .w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:80/'); //U can change localhost(127.0.0.1) to Your console IP address


//config 
wing = 1;   //set wing 1, 2 or 3
page = 1;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)
midi_in = 'APC mini mk2';     //set correct midi in device name
midi_out = 'APC mini mk2';    //set correct midi out device name
brightness = 5;     //led brightness 0-6
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
var ledmatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
} else if (wing == 3) {
    faderValueMem[56] = 1;
    var buttons = [15, 16, 17, 18, 19, 20, 21, 22, 15, 16, 17, 18, 19, 20, 21, 22, 180, 181, 182, 183, 184, 185, 186, 187, 170, 171, 172, 173, 174, 175, 176, 177, 160, 161, 162, 163, 164, 165, 166, 167, 150, 151, 152, 153, 154, 155, 156, 157, 140, 141, 142, 143, 144, 145, 146, 147, 130, 131, 132, 133, 134, 135, 136, 137];
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
            client.send('{"requestType":"playbacks","startIndex":[100],"itemsCount":[90],"pageIndex":' + pageIndex + ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}')
            client.send('{"requestType":"playbacks","startIndex":[0],"itemsCount":[10],"pageIndex":' + pageIndex2 + ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
        }
        else if (wing == 2) {
            client.send('{"requestType":"playbacks","startIndex":[100],"itemsCount":[90],"pageIndex":' + pageIndex + ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}')
            client.send('{"requestType":"playbacks","startIndex":[0],"itemsCount":[15],"pageIndex":' + pageIndex2 + ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
        }
        else if (wing == 3) {
            client.send('{"requestType":"playbacks","startIndex":[130],"itemsCount":[60],"pageIndex":' + pageIndex + ',"itemsType":[3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}')
            client.send('{"requestType":"playbacks","startIndex":[15],"itemsCount":[10],"pageIndex":' + pageIndex2 + ',"itemsType":[2],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');

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
    output.send('noteon', { note: i, velocity: ledmatrix[i], channel: brightness });
    sleep(10, function () { });
}


//turn on page select buttons
if (page > 0) {
    output.send('noteon', { note: 112, velocity: 127, channel: 0 });
    output.send('noteon', { note: 113, velocity: 0, channel: 0 });
    output.send('noteon', { note: 114, velocity: 0, channel: 0 });
    output.send('noteon', { note: 115, velocity: 0, channel: 0 });
    output.send('noteon', { note: 116, velocity: 0, channel: 0 });
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

    if (msg.note >= 112 && msg.note <= 116) {//page select
        if (page == 1) {
            output.send('noteon', { note: (pageIndex + 112), velocity: 0, channel: 0 });
            pageIndex = msg.note - 112;
            output.send('noteon', { note: (msg.note), velocity: 127, channel: 0 });
        }
        if (page == 2) {
            output.send('noteon', { note: (pageIndex + 112), velocity: 0, channel: 0 });
            pageIndex = msg.note - 112;
            pageIndex2 = msg.note - 112;
            output.send('noteon', { note: (msg.note), velocity: 127, channel: 0 });
        }

    }



    if (msg.note == 122) {//Shift Button
        if (wing == 1 || wing == 3) {
            if (blackout == 0) {
                client.send('{"command":"SpecialMaster 2.1 At 0","session":' + session + ',"requestType":"command","maxRequests":0}');
                blackout = 1;
            } else if (blackout == 1) {
                client.send('{"command":"SpecialMaster 2.1 At ' + faderValueMem[56] * 100 + '","session":' + session + ',"requestType":"command","maxRequests":0}');
                blackout = 0;
            }
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

                } else if (wing == 3) {
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
                        l++;
                        j = j - 16;
                    }
                }
            }

            if (obj.responseSubType == 2) {//Fader LED
                if (wing == 1) {
                    j = 0;
                    for (var i = 0; i < 5; i++) {
                        m = f1;

                        if ((obj.itemGroups[0].items[0][i].i.c) != "#000000") {
                            m = f2;
                        }
                        if (i == 0 && wing == 1 && pageIndex2 == 0) {
                            m = f2;
                        }
                        if (ledmatrix[j + 8] != m) {
                            ledmatrix[j + 8] = m;
                            output.send('noteon', { note: j + 8, velocity: m, channel: brightness });
                        }

                        if (obj.itemGroups[0].items[0][i].isRun) {
                            m = f3;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: brightness });
                        }

                        m = 0;
                        if (obj.itemGroups[0].items[0][i].isRun) {
                            m = 127;
                        }

                        if (ledmatrix[j + 100] != m) {
                            ledmatrix[j + 100] = m;
                            output.send('noteon', { note: j + 100, velocity: m, channel: 0 });
                        }

                        j++;
                    }

                    for (var i = 0; i < 3; i++) {
                        if ((obj.itemGroups[0].items[1][i].i.c) == "#000000") {
                            m = f1;
                        } else {
                            m = f2;
                        }
                        if (ledmatrix[j + 8] != m) {
                            ledmatrix[j + 8] = m;
                            output.send('noteon', { note: j + 8, velocity: m, channel: brightness });
                        }

                        if (obj.itemGroups[0].items[1][i].isRun) {
                            m = f3;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: brightness });
                        }

                        m = 0;
                        if (obj.itemGroups[0].items[1][i].isRun) {
                            m = 127;
                        }

                        if (ledmatrix[j + 100] != m) {
                            ledmatrix[j + 100] = m;
                            output.send('noteon', { note: j + 100, velocity: m, channel: 0 });
                        }
                        j++;
                    }
                } else if (wing == 2) {
                    j = 0;
                    for (var i = 2; i < 5; i++) {
                        m = f1;

                        if ((obj.itemGroups[0].items[1][i].i.c) != "#000000") {
                            m = f2;
                        }
                        /*if (i == 0 && wing == 1 && pageIndex2 == 0) {
                            m = 3;
                        }*/
                        if (ledmatrix[j + 8] != m) {
                            ledmatrix[j + 8] = m;
                            output.send('noteon', { note: j + 8, velocity: m, channel: brightness });
                        }

                        if (obj.itemGroups[0].items[1][i].isRun) {
                            m = f3;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: brightness });
                        }

                        m = 0;
                        if (obj.itemGroups[0].items[1][i].isRun) {
                            m = 127;
                        }

                        if (ledmatrix[j + 100] != m) {
                            ledmatrix[j + 100] = m;
                            output.send('noteon', { note: j + 100, velocity: m, channel: 0 });
                        }

                        j++;
                    }

                    for (var i = 0; i < 5; i++) {
                        if ((obj.itemGroups[0].items[2][i].i.c) != "#000000") {
                            m = f2;
                        } else {
                            m = f1;
                        }
                        if (ledmatrix[j + 8] != m) {
                            ledmatrix[j + 8] = m;
                            output.send('noteon', { note: j + 8, velocity: m, channel: brightness });
                        }

                        if (obj.itemGroups[0].items[2][i].isRun) {
                            m = f3;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: brightness });
                        }

                        m = 0;
                        if (obj.itemGroups[0].items[2][i].isRun) {
                            m = 127;
                        }

                        if (ledmatrix[j + 100] != m) {
                            ledmatrix[j + 100] = m;
                            output.send('noteon', { note: j + 100, velocity: m, channel: 0 });
                        }
                        j++;
                    }
                } else if (wing == 3) {
                    j = 0;
                    for (var i = 0; i < 5; i++) {
                        m = f1;

                        if ((obj.itemGroups[0].items[0][i].i.c) != "#000000") {
                            m = f2;
                        }
                        /*if (i == 0 && wing == 1 && pageIndex2 == 0) {
                            m = f2;
                        }*/
                        if (ledmatrix[j + 8] != m) {
                            ledmatrix[j + 8] = m;
                            output.send('noteon', { note: j + 8, velocity: m, channel: brightness });
                        }

                        if (obj.itemGroups[0].items[0][i].isRun) {
                            m = f3;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: brightness });
                        }

                        m = 0;
                        if (obj.itemGroups[0].items[0][i].isRun) {
                            m = 127;
                        }

                        if (ledmatrix[j + 100] != m) {
                            ledmatrix[j + 100] = m;
                            output.send('noteon', { note: j + 100, velocity: m, channel: 0 });
                        }

                        j++;
                    }

                    for (var i = 0; i < 3; i++) {
                        if ((obj.itemGroups[0].items[1][i].i.c) == "#000000") {
                            m = f1;
                        } else {
                            m = f2
                        }
                        if (ledmatrix[j + 8] != m) {
                            ledmatrix[j + 8] = m;
                            output.send('noteon', { note: j + 8, velocity: m, channel: brightness });
                        }

                        if (obj.itemGroups[0].items[1][i].isRun) {
                            m = f3;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: brightness });
                        }

                        m = 0;
                        if (obj.itemGroups[0].items[1][i].isRun) {
                            m = 127;
                        }

                        if (ledmatrix[j + 100] != m) {
                            ledmatrix[j + 100] = m;
                            output.send('noteon', { note: j + 100, velocity: m, channel: 0 });
                        }
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
            m = c3;
            channel = 8;
        } else if ((obj.itemGroups[0].items[l][i].i.c) == "#000000") {
            m = c1
        } else {
            m = c2;
        }

        check_color((obj.itemGroups[0].items[l][i].bdC));

        if (ledmatrix[j] != m || led_isrun[j] != channel) {
            led_isrun[j] = channel;
            ledmatrix[j] = m;
            output.send('noteon', { note: j, velocity: m, channel: channel });
        }

    } else {
        m = c1;
        if (obj.itemGroups[0].items[l][i].isRun == 1) {
            m = c3;
        } else if ((obj.itemGroups[0].items[l][i].i.c) == "#000000") {
            m = c1
        } else {
            m = c2;
        }
        if (blink == 0){
            channel = brightness;
        } else if (blink == 1){
            channel = 9;
        }


        if (ledmatrix[j] != m) {
            ledmatrix[j] = m;
            output.send('noteon', { note: j, velocity: m, channel: channel });
        }
    }
    return;
}


function check_color(color) {

    if (color == "#FFFFFF") {//white
        m = 3;
    } else if (color == "#FF0000") {//red
        m = 5;//red
    } else if (color == "#FF7F00") {//orange
        m = 9;//orange
    } else if (color == "#FFFF00") {//yellow
        m = 13;
    } else if (color == "#7FFF00") {//fern green
        m = 17;
    } else if (color == "#00FF00") {//green
        m = 21;
    } else if (color == "#00FF7F") {//sea green
        m = 29;
    } else if (color == "#00FFFF") {//cyan
        m = 37;
    } else if (color == "#007FFF") {//lavender
        m = 41;
    } else if (color == "#0000FF") {//blue
        m = 45;//blue
    } else if (color == "#7F00FF") {//violet
        m = 49;
    } else if (color == "#FF00FF") {//magenta
        m = 53;
    } else if (color == "#FF007F") {//pink
        m = 57;
    } else {
        if (blink == 0) {
            channel = brightness;
        }
    }

    return;
}

