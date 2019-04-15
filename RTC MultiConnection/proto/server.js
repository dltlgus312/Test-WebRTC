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
app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/temp", express.static(__dirname + "/temp"));


// HTTPS SERVER OPEN
https = https.Server( options, app );
https.listen(443, ( ) => {
	console.log("HTTPS SERVER OPEN");
});


app.get('/', ( req, res ) => {
	res.sendfile( __dirname + '/index.html' );
});


var wstream, stackUrl = [], cnt = 1;

// Socket IO SETTING
io = io(https);
io.on( 'connection', ( socket ) => {
	
	console.log( 'SOCKET CONNECTION' );
	RTCMultiConnectionServer.addSocket(socket);
	
	socket.emit('urls', stackUrl);
	
	
	socket.on('disconnect', (data) => {
		console.log("DISCONNECTION USER");
	});
	
	socket.on('uploadFile', (data) => {
		console.log("STREAM DATA COMMING");			
		wstream = fs.createWriteStream( __dirname + "/temp/" + cnt + ".mp4" );
		wstream.write(data.data);
		wstream.end();
		
		var url = '/temp/' + cnt + '.mp4';	
		
		io.emit('uploadURL', {url: url, cnt: cnt});
		stackUrl.push(url);
		
		console.log(url);
		
		cnt += 1;
	});
});



