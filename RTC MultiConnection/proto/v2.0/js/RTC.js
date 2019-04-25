
// enables.video = div || video;
// enables.peerVideo = div || video;
// enables.screen = div || video; (exact)
// enables.canvas = div; (exact)
// enables.fileShare = div; (exact)


// enables.setting = true; >> iframe 모듈
// enables.recorde = true; (exact)
// enables.recordeWatch = true; >> 방장 녹화 (감시용) (exact)
// enables.dataChannel = true; (exact)

function RTC(enables){
	
	if(!!!enables) {
		enables = {};
		enables.video = false;
		enables.peerVideo = false;
		enables.screen = true;
		enables.recorde = true;
		enables.recordeWatch = false;
		enables.dataChannel = true;
		enables.canvas = false;
		enables.fileShare = false;
		enables.setting = false;
	}

	if(!!enables.canvas || !!enables.fileShare){
		enables.dataChannel = true;
	}

	this.enables = enables;
	
	var stunOption = {
		urls: 'stun:192.168.25.4:3478'
	}
	
	var turnOption = {
		urls: 'turn:211.44.246.219:3478?transport=tcp',
		credential: 'test',
		username: 'test'
	};
	
	var session = {
		data: !!enables.dataChannel
	}
	
	var conn;
	
	conn = new RTCMultiConnection();
	
	conn.socketURL = '/';
	
	conn.dontCaptureUserMedia = true;
	
	conn.maxParticipantsAllowed = 2;
	
	conn.iceServers = [];
	
	conn.iceServers.push(stunOption);

	conn.iceServers.push(turnOption);
	
	conn.session = session;
	
	conn.enableFileSharing = !!enables.fileshare;
	
	this.conn = conn;
	
	var rtc = this;
	
	
	// ######## RTC Multi Connection Event ########
	this.setstream = function(event) {
		
		if(!!!enables.video && !!!enables.peerVideo && !!!enables.screen){
			rtc.onstream(event);
			return;
		}
		
		var evt = event;
		
		if(!!!event.type){
			evt = [];
			evt.stream = event;
			evt.streamid = event.id;
			evt.type = 'local';
			evt.userid = rtc.conn.userid;
			
			var video = document.createElement('video');
			video.id = event.id;
			
			evt.mediaElement = video;
		}
		
		var contain;

		contain = !!evt.stream.isScreen ? rtc.enables.screen || rtc.enables.screen.exact : evt.type === 'remote' ? rtc.enables.peerVideo || rtc.enables.video : rtc.enables.video;
		
		if(!!!contain) {
			rtc.onstream(evt);
			return;
		}else if(contain instanceof jQuery){
			contain = contain[0];
		}
		
		if(contain instanceof HTMLDivElement){
			contain.innerHTML = '';
			contain.appendChild(evt.mediaElement);
			evt.mediaElement.play();
		}else if(contain instanceof HTMLVideoElement){
			contain.srcObject = evt.stream;
			contain.play();
		}
	};

	this.onopen = function(event) {
		if (designer.pointsLength <= 0) {
			setTimeout(function() {
				this.conn.send('plz-sync-points');
			}, 1000);
		}
	};

	this.onRoomFull = function(err) {
		if(err.indexOf('full') !== -1){
			console.error(err);
			alert('방이 꽉 찼습니다.');
		}else {
			console.error(err);
			alert('동일 아이디 접속자가 있습니다.');
		}
	};

	this.onleave = function(event){
		// event.userid, event.extra // 한번 호출
	}

	this.onstreamended = function(event) {
		if (!event.mediaElement) {
			event.mediaElement = document.getElementById(event.streamid);
		}
		
		if (!event.mediaElement || !event.mediaElement.parentNode) {
			location.reload();
			return;
		}
		
		event.mediaElement.parentNode.removeChild(event.mediaElement);
	};
	
	
	this.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId){
		// Re join depend
		console.error('Already Join ID: ' + useridAlreadyTaken);
		alert('동일 아이디 접속자가 있습니다.');
	}
	
}



RTC.prototype.onBrowserNotSupportError = function(errors){
	errors.forEach(function(err){
		if(err === 'all'){
			alert('다른브라우저를 이용해주세요');
		}else if(err === 'screen'){
			alert('스크린 영상을 지원하지 않는 브라우저입니다.');
		}else if(err === 'recorde'){
			alert('녹화를 지원하지 않는 브라우저 입니다.');
		}else if(err === 'dataChannel'){
			alert('데이터 공유를 지원하지 않는 브라우저 입니다.');
		}
	});
}

RTC.prototype.onMediaCaptureError = function(err, isAudio){
	if(err === 'AbortError'){
		alert("카메라가 다른 장치에서 이미 사용 중 입니다.");
	}else if(err === 'NotAllowedError'){
		alert("카메라에 대한 권한을 해제 후 사용가능 합니다.");
	}else if(err === 'NotFoundError'){
		if(!!isAudio){
			alert("연결 가능한 오디오가 없습니다.");
		}else {
			alert("연결 가능한 카메라가 없습니다.");
		}
	}else if(err === 'NotReadableError'){
		alert("알수없는 오류가 발생했습니다.");
	}else if(err === 'SecurityError'){
		alert("HTTPS가 아닌 연결 에러");
	}else if(err === 'NotSupportedError'){ 
		alert("지원 불가");
	}else if(err === 'InvalidAccessError'){ 
		alert("인자값 오류");
	}else if(err === 'TypeError'){ 
		// alert("모든제약조건이 false 이거나 제약 조건이 비어있음");
		alert("알수없는 에러");
	}else if(err === 'ReferenceError'){ 
		alert("알수없는 에러");
	}else {
		alert(err);
	}
}

RTC.prototype.browserNotSupportErrorHandler = function (){
	
	var notSupportList = [];
	
	var enables = this.enables;
	
	var notSupportCriticalList = [];
	
	
	if(!!!window.RTCPeerConnection){
		notSupportCriticalList.push('all');
	}
	
	window.navigator.mediaDevices = window.navigator.mediaDevices || window.navigator;
	
	if(!!!window.navigator.mediaDevices.getUserMedia){
		notSupportCriticalList.push('all');
	}
	
	if(!!enables.screen && !!!window.navigator.mediaDevices.getDisplayMedia && window.navigator.userAgent.indexOf('Chrome') === -1 && window.navigator.userAgent.indexOf('Edge') !== -1){
		notSupportList.push('screen');
		if(!!enables.screen.exact){
			notSupportCriticalList.push('screen');
		}
	}
	
	if(( !!enables.recorde || !!enables.recordeWatch ) && window.MediaRecorder === undefined) {
		notSupportList.push('recorde');
		if(!!enables.recorde.exact || !!enables.recordeWatch){
			notSupportCriticalList.push('recorde');
		}
	}
	

	if(enables.dataChannel && !!!new RTCPeerConnection().createDataChannel){
		notSupportList.push('dataChannel');
		if(!!enables.dataChannel.exact || !!enables.canvas.exact || !!enables.fileShare.exact){
			notSupportCriticalList.push('dataChannel');
		}
	}
	
	this.notSupportList = notSupportList;
	
	this.onBrowserNotSupportError(notSupportCriticalList);
	
	return notSupportCriticalList;				
}

RTC.prototype.mediaCaptureErrorHandler = function(err, isAudio){
	
	console.error("에러 : " + err);
	
	this.onMediaCaptureError(err.name, isAudio);
	
}


















// #################################################################
// #################################################################
RTC.prototype.openOrJoin = function(userid, roomid){
	
	var rtc = this;
	
	// userid == roomid ? super : user
	if(!!userid && !!!roomid){
		rtc.conn.userid = userid;
		rtc.conn.sessionid = userid;
		
		rtc.permission = 'super';
	}else if(!!roomid){
		rtc.conn.sessionid = roomid;
		rtc.permission = 'user';
		
		if(!!userid){
			rtc.conn.userid = userid;
			if(userid==roomid){
				rtc.permission = 'super';
			}
		}
	}else if(!!!userid && !!!roomid){
		rtc.conn.sessionid = conn.userid;
		
		rtc.permission = 'super';
	}
	
	rtc.beforeOpenOrJoin(function(err){
		if(err){
			return;
		}
		rtc.conn.openOrJoin(rtc.conn.sessionid);
	})
}

RTC.prototype.beforeOpenOrJoin = function(callback){
	
	var rtc = this;
	
	var errors = rtc.browserNotSupportErrorHandler();
	
	if(errors.length !== 0){			
		alert('접속이 불가능 합니다.');
		console.log("Not Working List : " + errors);
		callback('return');
		return ;
	}
	
	rtc.eventHandler();
	
	rtc.getFindHighestResolutionWidth(function(width){	
		
		// if(rtc.conn.DetectRTC.browser.name === 'Firefox' || rtc.conn.DetectRTC.browser.name === 'Edge' ){}
		
		var constraints = {
			video:{
				width: width,
				height: width/16*9
			}
		};
		
		rtc.getUserMedia(constraints, false, function(stream, err){
			stream.isVideo = true;
			
			rtc.setstream(stream);
			
			rtc.conn.attachStreams = [stream];
			
			callback();
		});
		
	});
}

RTC.prototype.eventHandler = function(){
	var rtc = this;
	
	rtc.conn.onstream = rtc.setstream;

	rtc.conn.onopen = rtc.onopen;
	
	rtc.conn.onRoomFull = rtc.onRoomFull;
	
	rtc.conn.onleave = rtc.onleave;
	
	rtc.conn.onstreamended = rtc.onstreamended;
	
	rtc.conn.onUserIdAlreadyTaken = rtc.onUserIdAlreadyTaken;
}


RTC.prototype.setContains = function(contains){
	this.enables = contains;
}

RTC.prototype.getFindHighestResolutionWidth = function(callback){
	
	var constraints = {
		video : {
			width: { ideal: 1280 },
			height: { ideal: 720 }			
		}
	};
	
	this.getUserMedia(constraints, false, function(stream){
		var width = this.highestResolutionWidth = stream.getVideoTracks()[0].getSettings().width;
		callback(width);
	});
}

RTC.prototype.getUserMedia = function(constraints, isAudio, callback){	
	
	var rtc = this;
	
	navigator.mediaDevices.getUserMedia(constraints)
	.then(function(mediaStream){
		if(!!isAudio){
			navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true
				}
			}).then(function(audioStream){				
				mediaStream.addTrack(audioStream.getAudioTracks()[0]);
			}).catch(function(err){
				// callback(null, err);
				rtc.mediaCaptureErrorHandler(err, true);
			});
		}
		callback(mediaStream);;
	}).catch(function(err){
		// callback(null, err);
		rtc.mediaCaptureErrorHandler(err, false);
	});
}








// Override Event Method
RTC.prototype.onstream = function(event){
	
}





