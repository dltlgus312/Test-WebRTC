
// socket.in( socket.roomId ).emit( 'messages', data );
// socket.broadcast.to( socket.roomId ).emit( 'messages', data );

module.exports = exports = function CustomServer(io) {
	
	var io = io;
	
	this.addSocket = function(socket){
		
		var params = socket.handshake.query;
		
		var sessionid = params.sessionid;
		
		var maxParticipantsAllowed = parseInt(params.maxParticipantsAllowed || 1000) || 1000;
		
		var socketMessageEvent = params.msgEvent || 'RTCMultiConnection-Message';
		
		params.socketMessageEvent = socketMessageEvent;
		
		socket.userid = params.userid;
		
		socket.on('disconnect-with', function(remoteUserId, callback) {
			socket.emit('user-disconnected', remoteUserId);
		});
		
		socket.on('close-entire-session', function(callback) {
			callback(true);
		});
		
		socket.on('check-presence', function(roomid, callback) {
			io.adapter.clients([ sessionid ], function(err, clients) {
				var roomClients = clients;
				if(roomClients.length >= maxParticipantsAllowed){
					callback(false, roomid);
				}else {
					callback(true, roomid);
				}
			});
		});
		
		socket.on('open-room', function(arg, callback) {
			socket.join(sessionid);
			callback(true);
		});
		
		socket.on('join-room', function(arg, callback) {
			socket.join(sessionid);
			callback(true);
		});
		 
		socket.on('disconnect', function() {
			socket.in(sessionid).emit('user-disconnected', socket.userid);
			
            if (socket.ondisconnect) {
                try {
                    socket.ondisconnect();
                }
                catch(e) {
                    pushLogs('socket.ondisconnect', e);
                }
            }
		});
		 
		socket.on(socketMessageEvent, function(message, callback) {
			
			if (message.remoteUserId && message.remoteUserId === socket.userid) {
                // remoteUserId MUST be unique
                return;
            }
			
			socket.in( sessionid ).emit( socketMessageEvent, message );

		});
	}
	
}