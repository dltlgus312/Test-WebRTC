var fs = require('fs');
var express = require( 'express' );
var app = express( );
var https = require('https');
var io = require( 'socket.io' );
var RTCMultiConnectionServer = require('rtcmulticonnection-server');

var options = {
  pfx: fs.readFileSync('./keys/server.pfx'),
  passphrase: 'root'
};


// JS FILE LOAD
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use("/css", express.static(__dirname + "/record/css"));
app.use("/js", express.static(__dirname + "/record/js"));


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

app.get('/screen', ( req, res ) => {
	res.sendfile( 'screen.html' );
});

app.get('/canvas', ( req, res ) => {
	res.sendfile( 'canvas.html' );
});

app.get('/streams', ( req, res ) => {
	res.sendfile( 'streams.html' );
});

app.get('/record', ( req, res ) => {
	res.sendfile( 'record.html' );
});

app.get('/records', ( req, res ) => {
	res.sendfile( 'records.html' );
});

app.get('/resolution', ( req, res ) => {
	res.sendfile( 'resolution.html' );
});

app.get('/facing', ( req, res ) => {
	res.sendfile( 'facing.html' );
});

app.get('/device', ( req, res ) => {
	res.sendfile( 'device.html' );
});


var wstream;

// Socket IO SETTING
io = io(https);
io.on( 'connection', ( socket ) => {
	// console.log(socket);
	console.log( 'a user connected' );
	RTCMultiConnectionServer.addSocket(socket);
		
	
	socket.on('disconnect', (data) => {
		console.log('disconnection EVENT');
	});
	
	
	socket.on('uploadStart', (data) => {
		wstream = fs.createWriteStream( __dirname + '/temp/test.webm', 'utf8');
	});
	
	socket.on('uploadFile', (data) => {
		
		wstream.write(data.data, 'utf8');
		
		if(!data.lastData){
			console.log("STREAM DATA COMMING");			
		}else {
			if(wstream){
				console.log("===== DATA END & CLOSE =====");
				wstream.end();
			}
		}
	});
});



