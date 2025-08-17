# ma2apcmini
Nodejs code program - to control grandMA2 via web remote

use Akai APC mini midi controller or Akai APC mini mk2 - free - led feedback



HOW TO!


Download and install NodeJS version 14.17 from https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi

Download my code archive & unrar to c: (or where U want)


Start grandMA2

Add user "apcmini" - password "remote"

Tunr on web remote. (remotes - login enabled)

Set node.exe as default tool to open .js file

double click on icon  ma2apcmini.js (for apc mini)

or if u have mk2 model

 ma2apcmini_mk2.js


---------------------------------


 
If need config 

Edit ma2apcmini.js (use notepad)

find this lines


//config 

wing = 1;   //set wing 1, 2 or 3 mode

pageselect = 1;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)

midi_in = 'APC MINI';     //set correct midi in device name

midi_out = 'APC MINI';    //set correct midi out device name 


mk2 version and mk2 color

//config
const wing = 1; //set wing 1, 2, or 3
const pageselect = 1; //set page select mode - 0-off, 1-only exec buttons , 2-exec buttons and faders
const control_onpc_page = 1; // change pages onpc 0=off, 1=on
const midi_in = "APC mini mk2"; //set correct midi in device name
const midi_out = "APC mini mk2"; //set correct midi out device name
const brightness = 6; //led brightness 0-6 (work in autocolor = 0)
const color_scheme = 0; //color scheme - 0 = Default(AmberGreen) , 1 - dark (GrayGreen), 2 = extra (BlueRed)
const autocolor = 0; //xecutors color from apperance - 0 = off, 1 = ON, 2 = ON (full color from apperance - no brighness), 3 MIX - 2color + Autocolor (full color)
const blink = 0; //no color Executor blink 1=on, 0=off (work in autocolor = 0)


--------------------------------
WING MODES


WING = 1

Executors (3 x 5 view)

101 - 108

116 - 123

131 - 138

...

176 - 183

faders

1 - 8 + grand master fader




WING = 2

Ececutors (3 x 5 view)

108 - 115

123 - 130

139 - 145

...

183 - 190

faders

8 - 15 + speed master 1 + lern (shift button)




WING = 3

Executors ( wing 1 - 2 x 5 view)

131 - 140

141 - 150

151 - 160

...

191 - 190

faders

16 - 23 + grand master fader


-------------------------------


If U want connect to console:

find this line

var client = new W3CWebSocket('ws://localhost:80/');

and change localhost:80 to console IP Addres

if u have any problems with connection - try change localhost to 127.0.0.1

-------------------------------- 


AKAI APC CONTROL


Executors ( 6 x 8 )

Color Yellow - if programed

Color Green - if run


Faders ( 3 x 8 )

Color Yellow if programed

Color Green if run



SCENE LAUCH BUTTONS ON RIGHT SIDE

Select PAGE 1-8


last fader - Grand Master



---------


If you get undefined 1 error (onPC version does not support this functionality)


This code will not work with the older PC version of GrandMA2 (like 3.1.2.5) because this version does not have webremote control,


U can use this code to control show only - not for programming

------------------------


!!! Program not work with old ma2onpc

!! Program not work - if any executor have more then 1 row ! (thx Philipp Darpe) (only old apc mini vesrion)

v.1.7.x
When the code starts, the Akai displays the active mode in a graphical form.
Mk2 code received the wing=3 mode in a slightly modified form.
In this mode, all faders 1–9 are supported.

The buttons above them control the executor assigned to each fader (the last fader acts as a shift button and does not have LED feedback).

The entire 8x8 executor panel handles action buttons in a 2-row by 5-button view,
which provides full utilization of the MIDI controller with these buttons.

v.2.0.x
Fixed color decode and combined executors
Add Autocolor 2 mode (full rgb)

v.2.1
Fixed close terminal function
Change dark mode to color_scheme

Add one mor scheme (Blue ReD)

Add new Autocolor mode 2
Is mixed 2 color and multicolor (executor with default apperance use 2 color scheme)

WORK IN PROGRESS .... 

--------------------

Tips

Turn off autofix option for Action Buttons - use command

Assign Executor 101 Thru 190 /Autofix = "Off"

