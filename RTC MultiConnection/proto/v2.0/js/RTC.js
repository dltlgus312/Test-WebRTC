
// enables.video = div || video;
// enables.peerVideo = div || video;
// enables.screen = div || video; (exact)
// enables.canvas = div; (exact)
// enables.fileShare = div; (exact)
// enables.setting = div;


// enables.dataChannel = true; (exact)
// enables.recorde = true; (exact)
// enables.monitoring = true; >> 방장 녹화 (감시용)

function RTC(enables){
	
	var rtc = this;
	
	rtc.conn = null;
	
	rtc.enables = null;
	
	rtc.video = null;
	
	rtc.screen = null;
	
	rtc.remoteStreams = [];
	
	rtc.designer = null;
	
	rtc.msr = null;
	
	rtc.msrContents = null;
	
	rtc.resolutionSelect = null;
	
	rtc.deviceSelect = null;
	
	rtc.permission = null;
	
	rtc.msrTime = 10 * 1000;
	
	rtc.defResolution = {
		width: 1920,
		height: 1080
	}
	
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
		enables.monitoring = true;
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
	
	conn.enableFileSharing = !!enables.fileShare;
	
	rtc.conn = conn;
	
	
	
	
	
		
	//##############################################

	// RTC Multi Connection Event 

	//##############################################
	
	this.setstream = function(event) {
		
		console.log(event);
		
		var evt = event;
		
		if(!!!event.type){
			
			// event : 로컬 스트림 >> 원격스트림과 규격 통일
			
			evt = [];
			
			evt.stream = event;
			
			evt.stream.streamid = event.id;
			
			evt.streamid = event.id;
			
			evt.type = 'local';
			
			evt.userid = rtc.conn.userid;
			
			var video = document.createElement('video');
			
			video.id = event.id;
			
			video.srcObject = event;
			
			video.muted = true;
			
			evt.mediaElement = video;
			
			if(!!rtc.enables.monitoring && rtc.permission === 'super' && rtc.notSupportList.indexOf('recorde') === -1 && !!rtc.msr){
				// ##
				// rtc.msr.addStream(evt.stream);
			}
			
		}else {
			
			// event : 원결 스트림 >> 녹화시작
			
			rtc.remoteStreams.push(event.stream);
			
			if(!!rtc.enables.monitoring && rtc.permission === 'super' && rtc.notSupportList.indexOf('recorde') === -1){

				if(!!rtc.msr){
					
					// ##
					// rtc.msr.addStream(evt.stream);
					
				}else {
					
					// ##
					// var streams = rtc.remoteStreams.slice(0);
					
					// if(!!rtc.video){
						// streams.push(rtc.video);
					// }
					// if(!!rtc.screen){
						// streams.push(rtc.screen);
					// }
					
					// var msr = rtc.recording(streams, rtc.msrTime);
					
					// rtc.msr = msr;
					
				}
			}
		}
		
		
		evt.stream.play = function(){
			document.getElementById(evt.stream.streamid).play();
		};
		
		evt.stream.stop = function(){
			evt.stream.getTracks().forEach(function(track){
				track.enabled = false;
			});
		};
		
		if(evt.type === 'local'){
			
			evt.stream.onactive = function(event){
				rtc.stopOrStart(event.target.streamid, true, { enabled : true });
			}
			
			evt.stream.oninactive = function(event){
				rtc.stopOrStart(event.target.streamid, true, { enabled : false });
			}
			
		}else{
		
		}
		
		rtc.resolutionSetting(evt.stream);
		
		rtc.onstream(rtc, evt);
	};

	this.onopen = function(event) {
		if (!!rtc.designer && rtc.designer.pointsLength <= 0) {
			setTimeout(function() {
				rtc.conn.send('plz-sync-points');
			}, 1000);
		}
	};

	// Peer Disconnect Event
	// Parameter Data : event.userid, event.extra
	this.onleave = function(event){
		
	}

	this.onstreamended = function(event) {
		
		rtc.remoteStreams.splice(event.stream, 1);
		
		// 원격 피어가 하나도 없을 경우 모니터링 중지....
		if(rtc.remoteStreams.length === 0 && !!rtc.msr){
			rtc.msr.stop();
			rtc.msr = null;
		}

		if (!event.mediaElement) {
			event.mediaElement = document.getElementById(event.stream.streamid);
		}
		
		if (!event.mediaElement || !event.mediaElement.parentNode) {
			// location.reload();
			
			event.stream.stop();
			
			document.getElementById(event.stream.streamid).srcObject = null;
			
			return;
		}
		
		event.mediaElement.parentNode.removeChild(event.mediaElement);
	};
	
	this.onRoomFull = function(error) {
		if(error.indexOf('full') !== -1){
			console.error(error);
			alert('방이 꽉 찼습니다.');
		}else {
			console.error(error);
			alert('동일 아이디 접속자가 있습니다.');
		}
	};
	
	this.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId){
		// Re join depend
		console.error('Already Join ID: ' + useridAlreadyTaken);
		alert('동일 아이디 접속자가 있습니다.');
	}
	
	this.messageHandler = function(event){
		// console.log(event);
		
		if (event.data.stopOrStart){
			rtc.stopOrStart(event.data.id, event.data.isVideo, {rtc: rtc, enabled: event.data.enabled});
		}
		
		if (event.data === 'plz-sync-points' && !!rtc.designer) {
			rtc.designer.sync();
			return;
		}
		
		if (event.data.canvas && !!rtc.designer) {
			rtc.designer.syncData(event.data.data);
		}
		
		if (event.data.chat){
			var chatForm = "<label> 상대 : " + event.data.data + "</label></br>";
			var chatContain = document.getElementById("chat-contents");
			
			chatContain.innerHTML += chatForm;
			chatContain.scrollTop = chatContain.scrollHeight - chatContain.clientHeight;
		}
	}
}


















//##############################################

// Error Handler

//##############################################

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

RTC.prototype.onMediaCaptureError = function(error, isAudio){
	if(error === 'AbortError'){
		if(!!isAudio){
			alert("오디오를 불러오는 중 중단 되었습니다.");
		}else {
			alert("카메라가 다른 장치에서 이미 사용 중 입니다.");
		}
	}else if(error === 'NotAllowedError'){
		alert("카메라에 대한 권한을 해제 후 사용가능 합니다.");
	}else if(error === 'NotFoundError'){
		if(!!isAudio){
			alert("연결 가능한 오디오가 없습니다.");
		}else {
			alert("연결 가능한 카메라가 없습니다.");
		}
	}else if(error === 'NotReadableError'){
		alert("알수없는 오류가 발생했습니다.");
	}else if(error === 'SecurityError'){
		alert("HTTPS가 아닌 연결 에러");
	}else if(error === 'NotSupportedError'){ 
		alert("지원 불가");
	}else if(error === 'InvalidAccessError'){ 
		alert("인자값 오류");
	}else if(error === 'TypeError'){ 
		// alert("모든제약조건이 false 이거나 제약 조건이 비어있음");
		alert("알수없는 에러");
	}else if(error === 'ReferenceError'){ 
		alert("알수없는 에러");
	}else {
		alert(error);
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
	
	if((!!enables.recorde || !!enables.recordeWatch ) && window.MediaRecorder === undefined) {
		notSupportList.push('recorde');
		if(!!enables.recorde.exact || !!enables.recordeWatch){
			notSupportCriticalList.push('recorde');
		}
	}
	

	if(!!enables.dataChannel && !!!new RTCPeerConnection().createDataChannel){
		notSupportList.push('dataChannel');
		if(!!enables.dataChannel.exact || !!enables.canvas.exact || !!enables.fileShare.exact){
			notSupportCriticalList.push('dataChannel');
		}
	}
	
	this.notSupportList = notSupportList;
	
	this.onBrowserNotSupportError(notSupportCriticalList);
	
	return notSupportCriticalList;				
}

RTC.prototype.mediaCaptureErrorHandler = function(error, isAudio){
	
	console.error("에러 : " + error);
	
	this.onMediaCaptureError(error.name, isAudio);
	
}












//##############################################
//
// Main Start
//
//##############################################


RTC.prototype.openOrJoin = function(userid, roomid, permission){
	
	var rtc = this;
	
	rtc.permission = permission;
	
	if(!!!permission){
		rtc.permission = 'user';
	}
	
	if(userid === roomid){
		alert('user != roomid');
		return;
	}
	
	rtc.conn.userid = userid || rtc.conn.userid;
	
	rtc.conn.sessionid = roomid;
	
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
		video: rtc.defResolution
	};
	
	rtc.getUserMedia(constraints, 'allinput', function(stream){
		
		stream.isVideo = true;
		
		rtc.setstream(stream);
		
		rtc.conn.attachStreams = [stream];
		
		rtc.video = stream;
		
		if(!!rtc.video && !!rtc.enables.setting){
		
			rtc.deviceSetting(stream);
			
			navigator.mediaDevices.ondevicechange = function (event){
				rtc.deviceChange(stream, stream.getAudioTracks()[0].getSettings().deviceId, 'audioinput');
				rtc.deviceChange(stream, stream.getVideoTracks()[0].getSettings().deviceId, 'videoinput');
			};
		}
		
		callback(stream);
	});
}

RTC.prototype.afterOpenOrJoin = function(stream){
	var rtc = this;
	
	if(!!rtc.enables.fileShare && rtc.notSupportList.indexOf('dataChannel') === -1){
		rtc.fileShareSetting();
	}
	
	if(!!rtc.enables.canvas && rtc.notSupportList.indexOf('dataChannel') === -1){
		rtc.canvasSetting();
	}

}




















//##############################################

// Configual Setting

//##############################################

RTC.prototype.setContains = function(contains){
	this.enables = contains;
}

RTC.prototype.RMCEventHandler = function(){
	var rtc = this;
	
	rtc.conn.onstream = rtc.setstream;

	rtc.conn.onopen = rtc.onopen;
	
	rtc.conn.onRoomFull = rtc.onRoomFull;
	
	rtc.conn.onleave = rtc.onleave;
	
	rtc.conn.onstreamended = rtc.onstreamended;
	
	rtc.conn.onUserIdAlreadyTaken = rtc.onUserIdAlreadyTaken;
	
	if(!!rtc.enables.dataChannel && rtc.notSupportList.indexOf('dataChannel') === -1){
		rtc.conn.onmessage = rtc.messageHandler;
	}
}

RTC.prototype.fileShareSetting = function(){
	
	var rtc = this;
	
	rtc.enables.fileShare = rtc.enables.fileShare.exact || rtc.enables.fileShare;
	
	if(rtc.enables.fileShare instanceof jQuery){
		rtc.enables.fileShare = rtc.enables.fileShare[0];
	}
	
	rtc.conn.filesContainer = rtc.enables.fileShare;
}

RTC.prototype.canvasSetting = function(){
	
	var rtc = this;
	
	var designer = new CanvasDesigner();
		
	designer.widgetHtmlURL = '/node_modules/canvas-designer/widget.html';
	designer.widgetJsURL = '/node_modules/canvas-designer/widget.min.js';
	
	designer.setSelected('pencil');
	
	designer.setTools({
		pencil: true,
		eraser: true,
		image: false,
		pdf: false,
		text: false,
		line: false,
		arrow: false,
		dragSingle: false,
		dragMultiple: false,
		arc: false,
		rectangle: false,
		quadratic: false,
		bezier: false,
		marker: false,
		zoom: false,
		lineWidth: false,
		colorsPicker: true,
		extraOptions: false,
		code: false,
		undo: false
	});
		
	rtc.enables.canvas = rtc.enables.canvas.exact || rtc.enables.canvas;
	
	if(rtc.enables.canvas instanceof jQuery){
		rtc.enables.canvas = rtc.enables.canvas[0];
	}

	designer.appendTo(rtc.enables.canvas);
	
	designer.addSyncListener(function(data) {
		rtc.conn.send({canvas: true, data: data});
	});
	
	rtc.designer = designer;
	
}

RTC.prototype.deviceSetting = function(stream){
	var rtc = this;

	navigator.mediaDevices.enumerateDevices().then(function(devices){
		var elements = {};
		var values = {video:[], audioI:[], audioO:[]};
		
		var vSelect = document.createElement('select');
		var aiSelect = document.createElement('select');
		var aoSelect = document.createElement('select');
		
		elements.id = stream.streamid;
		vSelect.id = stream.streamid + '_videoSelect';
		aiSelect.id = stream.streamid + '_audioISelect';
		aoSelect.id = stream.streamid + '_audioOSelect';
		
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
				
				var vElement = document.getElementById(stream.streamid);
				
				if(!!vElement && vElement.sinkId !== 'undefined' && vElement.sinkId === device.deviceId){
					option.selected = true;
				}else if(!!vElement && vElement.sinkId !== 'undefined' && vElement.sinkId === '' && device.deviceId === 'default'){
					vElement.setSinkId('default');
					option.selected = true;
				}
				
			}
			
			stream.getTracks().forEach(function(track){
				if(device.kind !== 'audiooutput' && device.deviceId === track.getSettings().deviceId){
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
		
	}).catch(function(error){
		console.error(error);
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
	
	elements.id = stream.streamid;
	
	defaultOp = document.createElement('option');
	
	defaultOp.text = '해상도 선택';
	
	select = document.createElement('select');
	
	select.id = stream.streamid + '_resolution';
	
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


























//##############################################

// Development Event 

//##############################################
RTC.prototype.recording = function(streams, intervalTime, ondataavailable){
	
	if(!!intervalTime){
		var multiStreamRecorder = new MultiStreamRecorder(streams);
		
		multiStreamRecorder.mimeType = 'video/mp4;codecs=h264';
		
		if(!!ondataavailable){
			multiStreamRecorder.ondataavailable = ondataavailable;
		}else {
			multiStreamRecorder.ondataavailable = function(blob){
				
				console.log('monitoring data');
				
				rtc.conn.socket.emit('uploadFile', {data:blob});
				// multiRecordeTempUrl(blob);
			};			
		}
		
		multiStreamRecorder.start(intervalTime);
		
		// @@ 주기적으로 감시되고 있는지 체크...?? 필수
		
		return multiStreamRecorder;
	}else {
		// @@ 로컬 녹화
		
	}
}

RTC.prototype.getUserMedia = function(constraints, kind, callback){
	
	var rtc = this;
	
	if(kind === 'audioinput'){
		navigator.mediaDevices.getUserMedia(constraints)
		.then(function(audioStream){				
			callback(audioStream);
		}).catch(function(error){
			rtc.mediaCaptureErrorHandler(error, true);
		});
	}else if(kind === 'videoinput' || kind === 'allinput'){
		navigator.mediaDevices.getUserMedia(constraints)
		.then(function(mediaStream){
			if(kind === 'allinput'){
				navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true
					}
				}).then(function(audioStream){				
					mediaStream.addTrack(audioStream.getAudioTracks()[0]);
					callback(mediaStream);
				}).catch(function(error){
					rtc.mediaCaptureErrorHandler(error, true);
					callback(mediaStream);
				});
			}else {
				callback(mediaStream);
			}
		}).catch(function(error){
			rtc.mediaCaptureErrorHandler(error, false);
		});
	}else {
		console.error('audioinput, videoinput, allinput 중 1택');
	}
}

RTC.prototype.getDisplayMedia = function(callback){
	if(navigator.mediaDevices.getDisplayMedia){
		navigator.mediaDevices.getDisplayMedia({ 
			screen: true
		}).then(function(stream){
			callback(stream)
		}).catch(function(error){
			rtc.mediaCaptureErrorHandler(error, false);
		});
	}else if(navigator.userAgent.indexOf('Chrome') !== -1){
		getChromeExtensionStatus('hgpahehaffcbhjfccbhmdfehkokciibh', function(status) {
			if(status == 'installed-enabled') {
				sourceId =  null;
				// chrome extension is installed & enabled.
				getScreenConstraints(function(error, screen_constraints) {
					if (error) {
						// alert(error);
						console.log(error);
						return 
					}

					if(screen_constraints.canRequestAudioTrack) {
						navigator.mediaDevices.getUserMedia({
							video: screen_constraints,
							audio: screen_constraints
						})
						.then(function(stream) {
							callback(stream);
						}).catch(function(error){
							rtc.mediaCaptureErrorHandler(error, false);
						});
					}else {
						navigator.mediaDevices.getUserMedia({
							video: screen_constraints
						})
						.then(function(stream) {
							callback(stream);
						}).catch(function(error){
							rtc.mediaCaptureErrorHandler(error, false);
						});
					}
				}, true);
			}
			
			if(status == 'installed-disabled') {
				// chrome extension is installed but disabled.
			}
			
			if(status == 'not-installed') {
				// chrome extension is not installed
				var isInstall = confirm("스크린 공유를 지원하지 않는 브라우저 입니다. \n해당 브라우저에서 스크린공유를 원하실 경우 확장프로그램을 설치 하셔야 합니다. \n설치 하시겠습니까?");
				if(isInstall){
					window.parent.location.href = 'https://chrome.google.com/webstore/detail/ebsw-screencapturing/hgpahehaffcbhjfccbhmdfehkokciibh?authuser=1';
				}
			}
			
			if(status == 'not-chrome') {
				// using non-chrome browser
				alert('확장프로그램을 설치 할 수 없는 브라우저 입니다.');
			}
		});
	} else {
		alert('스크린공유를 지원하지 않는 브라우저 입니다.');
	}
}

RTC.prototype.deviceChange = function(stream, deviceId, kind){
	var rtc = this;
	
	var constraints;
	var isVideo = true;
	var oTrack;
	
	if(kind === 'audiooutput'){
		
		var element = document.getElementById(stream.streamid);
		
		if(!!element && element.sinkId !== 'undefined'){
			element.setSinkId(deviceId).then(function(){
				rtc.deviceSetting(stream);
			}).catch(function(error){
				rtc.mediaCaptureErrorHandler(error, true);
			});
		}
		
		return;
	} else if(kind === 'audioinput'){
		
		constraints = {	
			audio : {
				deviceId: deviceId,
				echoCancellation: true
			}
		}
		
		oTrack = stream.getAudioTracks()[0];
		
		isVideo = false;
	
	} else if(kind === 'videoinput'){
		oTrack = stream.getVideoTracks()[0];
		
		// Roll Back Setting ( 새로운 스트림이 기존의 셋팅을 유지하는 오류 )
		oTrack.applyConstraints(rtc.defResolution);
		
		constraints = {	
			video : {
				deviceId: deviceId,
				width: rtc.defResolution.width,
				height: rtc.defResolution.height
			}
		}
	}
	
	rtc.getUserMedia(constraints, kind, function(str){
		
		var nTrack = str.getTracks()[0];
		
		// param : old(stream || track), new(stream || track), remoteid, isVideo
		rtc.conn.replaceTrack(oTrack, nTrack, null, isVideo);
		
		stream.addTrack(nTrack);
		
		stream.removeTrack(oTrack);
		
		stream.play();

		rtc.deviceSetting(stream);
		
		if(isVideo){
			rtc.resolutionSetting(stream);
		}
	});
}

// 해상도 변경
RTC.prototype.resolutionChange = function(stream, value){
	var rtc = this;
	
	value = value.split('x');
	
	var track = stream.getVideoTracks()[0];

	track.applyConstraints({
		width : value[0],
		height : value[1]
	});
}

























//##############################################
//
// User Event 
//
//##############################################
RTC.prototype.screenShare = function(){
	
	var rtc = this;
		
	rtc.getDisplayMedia(function(newStream){
		
		if(!!!rtc.screen){

			newStream.isScreen = true;
			
			rtc.screen = newStream;
			
			rtc.setstream(newStream);
			
			rtc.conn.addStream(newStream);
			
		}else {
			
			var oldVideoTrack = rtc.screen.getVideoTracks()[0];
			var newVideoTrack = newStream.getVideoTracks()[0];
			
			var oldAudioTrack = rtc.screen.getAudioTracks()[0];
			var newAudioTrack = newStream.getAudioTracks()[0];
			
			rtc.conn.replaceTrack(oldVideoTrack, newVideoTrack, null, true);
			
			rtc.screen.removeTrack(oldVideoTrack);
			
			rtc.screen.addTrack(newVideoTrack);
			
			oldVideoTrack.enabled = false;
			
			oldVideoTrack.stop();
			
			if(!!oldAudioTrack){
				
				if(!!newAudioTrack){
					
					rtc.conn.replaceTrack(oldAudioTrack, newAudioTrack);
					
					rtc.screen.removeTrack(oldAudioTrack);
					
					rtc.screen.addTrack(newAudioTrack);
					
					oldAudioTrack.enabled = false;
					
					oldAudioTrack.stop();
				}else {
					
					rtc.screen.removeTrack(oldAudioTrack);
					
					oldAudioTrack.enabled = false;
					
					oldAudioTrack.stop();
				}
			} else if(!!newAudioTrack){
				
				rtc.screen.addTrack(newAudioTrack);
				
				newAudioTrack.start();
			}
		}
	});
}

RTC.prototype.fileShare = function(){
	
	var rtc = this;
	
	if(rtc.remoteStreams.length === 0){
		
		alert('파일을 공유할 유저가 없습니다.');
		
		return;
	}
	
	var fileSelector = new FileSelector();
	
	fileSelector.selectSingleFile(function(file) {
		rtc.conn.send(file);
	});
}

// 스트림 중지 & 스타트 (원격 & 로컬[ 사용자 조작, 권한 조작 이벤트 ])
RTC.prototype.stopOrStart = function(streamId, isVideo, param){
	if(!!param && !!param.rtc){
		var rtc = param.rtc;
		var enabled = param.enabled;
		
		if(isVideo){
				
			if(!!rtc.video && streamId === rtc.video.streamid){
				rtc.video.getVideoTracks()[0].enabled = enabled;
			}else if(!!rtc.screen && streamId === rtc.screen.streamid){
				rtc.screen.getVideoTracks()[0].enabled = enabled;
			}else {
				rtc.remoteStreams.forEach(function(stream){
					if(streamId === stream.streamid){
						stream.getVideoTracks()[0].enabled = enabled;
					}
				});
			}

		}else {
			// @@ 음소거
			// rtc.conn.attachStreams.forEach(function(localStream){
				// if(streamId === localStream.id){
					// var tracks = localStream.getAudioTracks();
					// tracks[0].mute = enabled;
				// }
			// });	
		}
	}else {
		var rtc = this;
		
		var enabled;
		
		var videoElement = document.getElementById(streamId);
		
		if(isVideo){
			
			var track = videoElement.srcObject.getVideoTracks()[0]
			
			if(!!param && !!param.enabled){
				enabled = param.enabled;
			}else {
				enabled = !track.enabled;			
			}
			
			track.enabled = enabled;
			
		}else {
			// @@ 음소거 mute = true || false;
			
			// var track = videoElement.srcObject.getAudioTracks()[0]
			
			// enabled = track.mute;
		}
		
		rtc.conn.send({
			stopOrStart : true,
			id: streamId,
			isVideo : isVideo,
			enabled: enabled
		});
	}
}


















//##############################################
//
// Override Method Event
//
//##############################################
// 원격 스트림 & 로컬 스트림
RTC.prototype.onstream = function(rtc, event){
	
	var enables = rtc.enables;
	
	var contain;

	contain = !!event.stream.isScreen ? rtc.enables.screen.exact || rtc.enables.screen : event.type === 'remote' ? rtc.enables.peerVideo || rtc.enables.video : rtc.enables.video;
	
	if(contain instanceof jQuery){
		contain = contain[0];
	}
	
	if(contain instanceof HTMLDivElement){
		contain.appendChild(event.mediaElement);
	}else if(contain instanceof HTMLVideoElement){
		contain.srcObject = event.stream;
		contain.id = event.stream.streamid;
	}else {
		console.error('contain(video, peerVideo, screen) type only Element', contain);
	}
	
	event.stream.play();
}

// Parameter Data : event.selects == Select Element Type List, event.values == Array Type List In To List
// 디바이스를 변경 할 수 있는 셀렉터 리스트 & 데이터 리스트
RTC.prototype.ondevicesetting = function(event){
	var rtc = this;
	
	for(index in event.elements){
		var select = event.elements[index]
		
		var element = document.getElementById(select.id);
	
		if(!!element){
			element.parentNode.removeChild(element);
		}
	}
	
	
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

// Parameter Data : event.selects == Select Element Type, event.values == Array Type List
// 해상도를 변경 할 수 있는 셀렉터 리스트 & 데이터 리스트
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







// Temp
RTC.prototype.multiRecordeTempUrl = function(blob){
	var url = URL.createObjectURL(blob);
	var html = "<a href='" + url + "' '> 녹화파일 </a><br/>";
	var contain = document.getElementById('url-server');
	contain.innerHTML += html;
	contain.scrollTop = contain.scrollHeight - contain.clientHeight;
}