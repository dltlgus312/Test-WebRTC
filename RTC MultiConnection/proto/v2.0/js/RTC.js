
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
	
	var rtc = this;
	
	rtc.conn = {};
	
	rtc.enables = {};
	
	rtc.streams = {};
	
	rtc.resolutionSelect = {};
	
	rtc.deviceSelect = {};
	
	rtc.permission = {};
	
	rtc.resolutions = [
		// 4:3
		{label: 'qqVGA', width: 160, height: 120},
		{label: 'qVGA', width: 320, height: 240},
		{label: 'VGA', width: 640, height: 480},
		// 16:9
		{label: 'nHD', width: 640, height: 360},
		{label: 'HD', width: 1280, height: 720},
		{label: 'FHD', width: 1920, height: 1080}
	]
	
	
	
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
	
	rtc.enables = enables;
	
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
	
	rtc.conn = conn;
	
	// ######## RTC Multi Connection Event ########
	this.setstream = function(event) {
		
		var evt = event;
		
		if(!!!event.type){
			evt = [];
			evt.stream = event;
			evt.streamid = event.id;
			evt.type = 'local';
			evt.userid = rtc.conn.userid;
			
			var video = document.createElement('video');
			video.id = event.id;
			video.srcObject = event;
			video.muted = true;
			evt.mediaElement = video;
		}
		
		
		if(!!!enables.video && !!!enables.peerVideo && !!!enables.screen){
			rtc.onstream(event);
			return;
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
			console.error(evt);
			contain.appendChild(evt.mediaElement);
			evt.mediaElement.play();
			
			evt.stream.play = function(){
				evt.mediaElement.play();
			};
		}else if(contain instanceof HTMLVideoElement){
			contain.srcObject = evt.stream;
			contain.id = evt.stream.id;
			contain.play();
			
			evt.stream.play = function(){
				contain.play();
			};
		}else {
			console.error('contain(video, peerVideo, screen) type only Element', contain);
		}
		
		
		rtc.resolutionSetting(evt.stream);
		
	};

	this.onopen = function(event) {
		if (designer.pointsLength <= 0) {
			setTimeout(function() {
				this.conn.send('plz-sync-points');
			}, 1000);
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
	
	this.onRoomFull = function(err) {
		if(err.indexOf('full') !== -1){
			console.error(err);
			alert('방이 꽉 찼습니다.');
		}else {
			console.error(err);
			alert('동일 아이디 접속자가 있습니다.');
		}
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
	
	var enables = this.enables;
	
	var notSupportList = [];
	
	var notSupportCriticalList = [];
	
	window.navigator.mediaDevices = window.navigator.mediaDevices || window.navigator;
	
	if(!!!window.RTCPeerConnection){
		notSupportCriticalList.push('all');
	}
	
	if(!!!window.navigator.mediaDevices.getUserMedia){
		notSupportCriticalList.push('all');
	}
	
	if(!!!enables.video && !!!enables.peerVideo){
		notSupportList.push('video');
		console.log('Not Found Video Contain');
		// notSupportCriticalList.push('video');
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
	}else {
		console.error(userid, roomid,);
	}
	
	rtc.beforeOpenOrJoin(function(data){
		if(data === 'return'){
			return;
		}
		rtc.conn.openOrJoin(rtc.conn.sessionid);
		rtc.afterOpenOrJoin(data);
	});
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
	
	rtc.RMCEventHandler();
	
	var constraints = {
		video:{
			width: 1920,
			height: 1080
		}
	};
	
	rtc.getUserMedia(constraints, 'all', function(stream, err){
		
		stream.isVideo = true;
		
		rtc.setstream(stream);
		
		rtc.conn.attachStreams = [stream];
		
		rtc.streams[stream.id] = stream;
		
		callback(stream);
	});
}

RTC.prototype.afterOpenOrJoin = function(stream){
	var rtc = this;
	
	if(!!rtc.streams && !!rtc.enables.video &&  !!rtc.enables.setting){
		
		rtc.deviceSetting(stream);
		
		navigator.mediaDevices.ondevicechange = function (event){
			// @@ 2번 호출 오류.....
			rtc.deviceChange(stream, stream.getAudioTracks()[0].getSettings().deviceId, 'audioinput');
			rtc.deviceChange(stream, stream.getVideoTracks()[0].getSettings().deviceId, 'videoinput');
		};
		
		// rtc.resolutionSetting(stream);
	}
}

RTC.prototype.deviceSetting = function(stream){
	var rtc = this;

	navigator.mediaDevices.enumerateDevices().then(function(devices){
		var elements = {};
		var values = {video:[], audioI:[], audioO:[]};
		
		var vSelect = document.createElement('select');
		var aiSelect = document.createElement('select');
		var aoSelect = document.createElement('select');
		
		elements.id = stream.id;
		vSelect.id = stream.id + '_videoSelect';
		aiSelect.id = stream.id + '_audioISelect';
		aoSelect.id = stream.id + '_audioOSelect';
		
		var vDefault = document.createElement('option');
		var aiDefault = document.createElement('option');
		var aoDefault = document.createElement('option');
		
		vDefault.text = '카메라 선택';
		aiDefault.text = '마이크 선택';
		aoDefault.text = '스피커 선택';
		
		vSelect.appendChild(vDefault);
		aiSelect.appendChild(aiDefault);
		aoSelect.appendChild(aoDefault);
		
		devices.forEach(function(device, index){
			var option = document.createElement('option');
			option.text = device.kind + " : " + device.label;
			option.value = device.deviceId;
			
			if(device.kind === 'videoinput'){
				vSelect.appendChild(option);
				values.video.push(device);
			}else if(device.kind === 'audioinput'){
				aiSelect.appendChild(option);					
				values.audioI.push(device);
			}else if(device.kind === 'audiooutput'){
				aoSelect.appendChild(option);					
				values.audioO.push(device);
			}
			
			stream.getTracks().forEach(function(track){
				if(device.deviceId === track.getSettings().deviceId){
					option.selected = true;
				}
			});
		});
		
		elements.video = vSelect;
		elements.audioI = aiSelect;
		elements.audioO = aoSelect;
		
		elements.video.onchange = function(event){
			rtc.deviceChange(stream, elements.video.options[elements.video.selectedIndex].value, 'videoinput');
		}
		
		elements.audioI.onchange = function(event){
			rtc.deviceChange(stream, elements.audioI.options[elements.audioI.selectedIndex].value, 'audioinput');
		}
		
		elements.audioO.onchange = function(event){
			rtc.deviceChange(stream, elements.audioO.options[elements.audioO.selectedIndex].value, 'audiooutput');
		}
		
		rtc.deviceSelect = {elements, values};
		
		rtc.ondevicesetting(rtc.deviceSelect);
		
	}).catch(function(err){
		console.error(err);
	});
}

RTC.prototype.deviceChange = function(stream, deviceId, kind){
	stream.getTracks().forEach(function(d){console.log(d.kind,d.getSettings().deviceId)});
	var rtc = this;
	var constraints;
	var isVideo = true;
	var oTrack;
	
	if(kind === 'audiooutput'){
		
		// oTrack = stream.getVideoTracks()[0];
		
		isVideo = false;
	} else if(kind === 'audioinput'){
		
		constraints = {	
			audio : {
				deviceId: deviceId ? { exact: deviceId } : '',
				echoCancellation: true
			}
		}
		
		oTrack = stream.getAudioTracks()[0];
		
		isVideo = false;
	
	} else if(kind === 'videoinput'){
	
		constraints = {	
			video : {
				deviceId: deviceId ? { exact: deviceId } : '',
				width: 1920,
				height: 1080
			}
		}
		
		oTrack = stream.getVideoTracks()[0];
		
	}
	
	rtc.getUserMedia(constraints, kind, function(str){
		
		var nTrack = str.getTracks()[0];
		
		// param : old(stream || track), new(stream || track), remoteid, isVideo
		rtc.conn.replaceTrack(oTrack, nTrack, null, isVideo);
		
		stream.removeTrack(oTrack);
		
		stream.addTrack(nTrack);
		
		stream.play();
		
		rtc.deviceSetting(stream);
		
		if(isVideo){
			rtc.resolutionSetting(stream);
		}
	});
}

RTC.prototype.resolutionSetting = function(stream){
	
	var optimalList = [], isOpt = false;
	
	var width = stream.getVideoTracks()[0].getSettings().width;
	var height = stream.getVideoTracks()[0].getSettings().height;
	
	for ( var index in rtc.resolutions ){
		
		var resolution = rtc.resolutions[index];
		
		optimalList.push(resolution);
		
		if(resolution.width === width && resolution.height === height){
			isOpt = true;
			break;
		}
	}
	
	if(!isOpt){
		optimalList = [];
		
		optimalList.push({label: 'high', width: width, height: height});
		
		optimalList.push({label: 'midle', width: Math.floor(width/3*2), height: Math.floor(height/3*2)});
		
		optimalList.push({label: 'low', width: Math.floor(width/3), height: Math.floor(height/3)});
	}
	
	var elements = {}, values = [], select, defaultOp;
	
	elements.id = stream.id;
	
	defaultOp = document.createElement('option');
	
	defaultOp.text = '해상도 선택';
	
	select = document.createElement('select');
	
	select.id = stream.id + '_resolution';
	
	select.appendChild(defaultOp);
	
	for ( var index in optimalList ){
		
		var opt = optimalList[index];
		
		var option = document.createElement('option');
		
		option.text = opt.label;
		
		option.value = opt.width + 'x' + opt.height;
		
		values.push(opt);
		
		select.appendChild(option);
		
		if(width === opt.width && height === opt.height){
			option.selected = true;	
		}
		
	}
	
	select.onchange = function(event){
		rtc.resolutionChange(stream, select.options[select.selectedIndex].value);
	}
	
	elements.select = select;
	
	rtc.resolutionSelect = {elements, values};
	
	rtc.onresolutionsetting(rtc.resolutionSelect);
	
}

RTC.prototype.resolutionChange = function(stream, value){
	var rtc = this;
	
	value = value.split('x');
	
	var track = stream.getVideoTracks()[0];

	// ##### 원격 비디오 화질 ... #####
	track.applyConstraints({
		width : value[0],
		height : value[1]
	});
}


RTC.prototype.RMCEventHandler = function(){
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

RTC.prototype.getUserMedia = function(constraints, kind, callback){	
	
	var rtc = this;
	
	if(kind === 'audioinput'){
		navigator.mediaDevices.getUserMedia(constraints)
		.then(function(audioStream){				
			callback(audioStream);
		}).catch(function(err){
			// callback(null, err);
			rtc.mediaCaptureErrorHandler(err, true);
		});
	}else if(kind === 'videoinput' || kind === 'all'){
		navigator.mediaDevices.getUserMedia(constraints)
		.then(function(mediaStream){
			if(kind === 'all'){
				navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true
					}
				}).then(function(audioStream){				
					mediaStream.addTrack(audioStream.getAudioTracks()[0]);
					callback(mediaStream);
				}).catch(function(err){
					rtc.mediaCaptureErrorHandler(err, true);
					callback(mediaStream);;	
				});
			}else {
				callback(mediaStream);;				
			}
		}).catch(function(err){
			rtc.mediaCaptureErrorHandler(err, false);
		});
	}else {
		console.error('audioinput, videoinput, all 중 1택');
	}
}








// !rtc.enables.video && !rtc.enables.peerVideo && !rtc.enables.screen 
// NOT FOUND Override Event Method
RTC.prototype.onstream = function(event){
	
}

// event.selects == Select ElementType, event.values == ArrayType
// Custom Override Event Method
RTC.prototype.ondevicesetting = function(event){
	var rtc = this;
	
	for(index in event.elements){
		var select = event.elements[index]
		
		var element = document.getElementById(select.id);
	
		if(!!element){
			element.parentNode.removeChild(element);
		}
	}
	
	// event.elements.forEach(function(select){
		// var element = document.getElementById(select.id);
	
		// if(!!element){
			// element.parentNode.removeChild(element);
		// }
	// });
	
	
	
	if(rtc.enables.setting instanceof jQuery){
		rtc.enables.setting = rtc.enables.setting[0];
	}else if(rtc.enables.setting instanceof HTMLDivElement){
		
	}else {
		console.error('enables.setting 타입이 \'HTMLDivElement\'가 아닙니다.');
		return;
	}
	
	// rtc.enables.setting.innerHTML = '';
	
	rtc.enables.setting.appendChild(event.elements.video);
	rtc.enables.setting.appendChild(event.elements.audioI);
	rtc.enables.setting.appendChild(event.elements.audioO);
}

RTC.prototype.onresolutionsetting = function(event){
	var rtc = this;
	
	var element = document.getElementById(event.elements.select.id);
	
	if(!!element){
		element.parentNode.removeChild(element);
	}
	
	if(rtc.enables.setting instanceof jQuery){
		rtc.enables.setting = rtc.enables.setting[0];
	}else if(rtc.enables.setting instanceof HTMLDivElement){
		
	}else {
		console.error('enables.setting 타입이 \'HTMLDivElement\'가 아닙니다.');
		return;
	}
	
	rtc.enables.setting.appendChild(event.elements.select);
}





