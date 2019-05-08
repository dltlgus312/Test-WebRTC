var fs = require('fs');
var express = require( 'express' );
var app = express( );
var https = require('https');
var io = require( 'socket.io' );

var jsdom = require('jsdom');

const {JSDOM} = jsdom;
const dom = new JSDOM();
const Blob = dom.window.Blob;
const FileReader = dom.window.FileReader;

var RTCMultiConnectionServer = require('rtcmulticonnection-server');

var options = {
  pfx: fs.readFileSync('../keys/server.pfx'),
  passphrase: 'root'
};


// JS FILE LOAD
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
// io = io(https);
// io.on( 'connection', ( socket ) => {
	
	// console.log( 'SOCKET CONNECTION' );
	// RTCMultiConnectionServer.addSocket(socket);
	
	
	// socket.on('disconnect', (data) => {
		// console.log("DISCONNECTION USER");
	// });
	
	// socket.on('monitoring', (data) => {
		// var wstream = fs.createWriteStream( __dirname + "/temp/" + data.name + ".mp4" );
		
		// wstream.write(Buffer.alloc(new Uint8Array(result)));
		
		// wstream.end();
	// });
// });





io = io(https);
var buffers = [];
io.on( 'connection', ( socket ) => {
	
	console.log( 'SOCKET CONNECTION' );
	RTCMultiConnectionServer.addSocket(socket);
	
	
	socket.on('disconnect', (data) => {
		console.log("DISCONNECTION USER");
	});
	
	socket.on('monitoring', (data) => {
		
		if(data.end){
			
			var byteLength = 0;
			buffers.forEach(function(buffer) {
				byteLength += buffer.byteLength;
			});
			
			var tmp = new Uint16Array(byteLength);
			var lastOffset = 0;
			buffers.forEach(function(buffer) {
				// BYTES_PER_ELEMENT == 2 for Uint16Array
				var reusableByteLength = buffer.byteLength;
				if (reusableByteLength % 2 != 0) {
					buffer = buffer.slice(0, reusableByteLength - 1)
				}
				tmp.set(new Uint16Array(buffer), lastOffset);
				lastOffset += reusableByteLength;
			});
			
			console.log(tmp.buffer);
			
			var blob = new Blob([tmp.buffer], {
				type: 'video/mp4',
				video: {
					width: 1280,
					height: 720
				}
			});
			
			var fileReader = new FileReader();
			
			fileReader.onload = function (result) {
				
				var wstream = fs.createWriteStream( __dirname + "/temp/" + data.name + ".mp4" );
				
				wstream.write(Buffer.alloc(new Uint8Array(result)));
				
				wstream.end();	
				
			};
			
			fileReader.readAsArrayBuffer(blob);
		
		}else {
			
			console.log(data.data);

			buffers.push(data.data);
		}
		
	});
});
