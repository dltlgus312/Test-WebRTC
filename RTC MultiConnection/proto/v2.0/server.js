var fs = require('fs');
var express = require( 'express' );
var app = express( );
var https = require('https');
var io = require( 'socket.io' );
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
	
	console.log( 'SOCKET CONNECTION' );
	RTCMultiConnectionServer.addSocket(socket);
	
	
	socket.on('disconnect', (data) => {
		console.log("DISCONNECTION USER");
	});
	
	socket.on('monitoring', (data) => {
		
		console.log(data);
		
		var wstream = fs.createWriteStream( __dirname + "/temp/" + data.name + ".mp4" );
		
		wstream.write(data.data);
		
		wstream.end();
	});
});

