# ma2apcmini
Nodejs code program - to control grandMA2 via web remote - use Akai APC mini midi controller - free - led feedback



HOW TO!


Dwonload and install NodeJS version 14.17 from https://nodejs.org/en/

Download my code archive & unrar to c: (or where U want)


Start grandMA2

Add user "dot2" - password "remote"

Tunr on web remote.


Start my code from CMD

node ma2apcmini.js


---------------------------------


 
If need config 

Edit ma2apcmini.js (use notepad)

find this lines


//config 

wing = 1;   //set wing 1, 2 or 3

page = 1;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)

midi_in = 'APC MINI 0';     //set correct midi in device name

midi_out = 'APC MINI 1';    //set correct midi out device name 


--------------------------------

If U want connect to console:

find this line

var client = new W3CWebSocket('ws://localhost:80/');

and change localhost:80 to console IP Addres

-------------------------------- 
