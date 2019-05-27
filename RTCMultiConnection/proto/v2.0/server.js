var fs = require('fs');
var express = require( 'express' );
var app = express( );
var https = require('https');
var io = require( 'socket.io' );
var ffmpeg = require('fluent-ffmpeg');
var RTCMultiConnectionServer = require('rtcmulticonnection-server');


var options = {
  pfx: fs.readFileSync('../keys/server.pfx'),
  passphrase: 'root'
};


// FILE LOAD
app.use("/node_modules", express.static(__dirname + "/../API/node_modules"));
app.use("/html", express.static(__dirname));
app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/image", express.static(__dirname + "/image"));
app.use("/temp", express.static(__dirname + "/temp"));


// HTTPS SERVER OPEN
https = https.Server( options, app );
https.listen(443, ( ) => {
	console.log("HTTPS SERVER OPEN");
});


app.get('/', ( req, res ) => {
	res.sendfile( __dirname + '/index.html' );
});



// Socket IO SETTING
io = io(https);
io.on( 'connection', ( socket ) => {
	
	RTCMultiConnectionServer.addSocket(socket);
	
});

