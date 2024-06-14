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

 ma2apcminimk2.js


---------------------------------


 
If need config 

Edit ma2apcmini.js (use notepad)

find this lines


//config 

wing = 1;   //set wing 1, 2 or 3 mode

pageselect = 1;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)

midi_in = 'APC MINI 0';     //set correct midi in device name

midi_out = 'APC MINI 1';    //set correct midi out device name 


in mk2 version u can select led brightness and new color mode


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

-------------------------------- 


AKAI APC CONTROL


Executors ( 6 x 8 )

Color Yellow - if programed

Color Green - if run


Faders ( 3 x 8 )

Color RED if programed

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

!! Program not work - if any executor have more then 1 row ! (thx Philipp Darpe)
