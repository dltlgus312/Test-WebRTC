var fs = require('fs');
var app = require( 'express' )( );
var https = require('https');
var io = require( 'socket.io' );
var RTCMultiConnectionServer = require('rtcmulticonnection-server');

var options = {
  pfx: fs.readFileSync('./keys/server.pfx'),
  passphrase: 'root'
};

// HTTPS SERVER OPEN
https = https.Server( options, app );
https.listen(443, ( ) => {
	console.log("https open");
});


// URL FORWORDING
app.get('/video', ( req, res ) => {
	res.sendfile( 'video.html' );
});

app.get('/file', ( req, res ) => {
	res.sendfile( 'file.html' );
});



// Socket IO SETTING ( Default URL = 'https://localhost/socket.io' )
io = io(https);
io.on( 'connection', ( socket ) => {
		console.log(socket);
		RTCMultiConnectionServer.addSocket(socket);
});