var fs = require('fs');
var express = require( 'express' );
var app = express( );
var https = require('https');
var io = require( 'socket.io' );
var RTCMultiConnectionServer = require('rtcmulticonnection-server');
var ffmpeg = require('fluent-ffmpeg');

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
var names = [];
var path = __dirname + "/temp/";
var exe = 'mp4';
io.on( 'connection', ( socket ) => {
	
	console.log( 'SOCKET CONNECTION' );
	RTCMultiConnectionServer.addSocket(socket);
	
	
	socket.on('disconnect', (data) => {
		console.log("DISCONNECTION USER");
	});
	
	socket.on('monitoring', (data) => {
		
		if(!data.end){
			
			var name = data.name + "." + exe;
			
			var wstream = fs.createWriteStream( path + name );
			
			wstream.write(data.data);
			
			wstream.end();
			
			names = names + 'file ' + name + '\n';
			
		} else {
			
			fs.writeFileSync( path + 'list.txt', names );
			
			var mg = ffmpeg();
			
			mg.input( path + 'list.txt' )
			.inputOptions(['-f concat', '-safe 0'])
			.outputOptions('-c copy')
			.save( path + 'test.' + exe );
			
		}
	});
});

