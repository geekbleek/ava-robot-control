const WebSocket = require('ws');

function WebSocketClient(){
	this.number = 0;	// Message number
	this.autoReconnectInterval = 5*1000;	// ms
}
WebSocketClient.prototype.open = function(url,socketProtocol){
    this.url = url;
    this.socketProtocol = socketProtocol;
	this.instance = new WebSocket(this.url, this.socketProtocol);
	this.instance.on('open',()=>{
		this.onopen();
	});
	this.instance.on('message',(data,flags)=>{
		this.number ++;
		this.onmessage(data,flags,this.number);
	});
	this.instance.on('close',(e)=>{
		switch (e.code){
		case 1000:	// CLOSE_NORMAL
			console.log("WebSocket: closed");
			break;
		default:	// Abnormal closure
			this.reconnect(e);
			break;
		}
		this.onclose(e);
	});
	this.instance.on('error',(e)=>{
		switch (e.code){
		case 'ECONNREFUSED':
			this.reconnect(e);
			break;
		default:
			this.onerror(e);
			break;
		}
	});
}
WebSocketClient.prototype.send = function(data,option){
	try{
		this.instance.send(data,option);
	}catch (e){
		this.instance.emit('error',e);
	}
}
WebSocketClient.prototype.reconnect = function(e){
	console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
        this.instance.removeAllListeners();
        clearInterval(this.keepAlive);
	var that = this;
	setTimeout(function(){
		console.log("WebSocketClient: reconnecting...");
		that.open(that.url, that.socketProtocol);
	},this.autoReconnectInterval);
}
WebSocketClient.prototype.onopen = function(e){	console.log("WebSocketClient: open",arguments);	}
WebSocketClient.prototype.onmessage = function(data,flags,number){	console.log("WebSocketClient: message",arguments);	}
WebSocketClient.prototype.onerror = function(e){	console.log("WebSocketClient: error",arguments);	}
WebSocketClient.prototype.onclose = function(e){	console.log("WebSocketClient: closed",arguments);	}

var wsc = new WebSocketClient();
var socketProtocol = 'irobot-bcr-scheduler';
wsc.open('wss://clusdevi:clus!devi1@cisco.ava8.net/client/', socketProtocol);
wsc.onopen = async function(e){
    console.log("WebSocketClient connected:",e);
    var pingObject = {
        "op": "request",
        "uri": "/rms/ping"
    }
    this.keepAlive = setInterval(() => {
        this.send(JSON.stringify(pingObject));
	}, 15000);

	let initResponse = await setupInit();
	console.log(setupInit);

}
wsc.onmessage = function(data,flags,number){
	message = JSON.parse(data)
	if (message.op !== 'push') {
		console.log(`WebSocketClient message #${number}: `,message);
	}
}


// async function initiateSession() {
// 	return new Promise((resolve, reject) => {
// 		wsc.send(JSON.stringify({
// 			"op": "request",
// 			"uri": "/rms/goToMap",
// 			"args": {
// 				"name": "AvaRoboticsHQ_09-20-17"
// 			}
// 		}),function(err){
// 			if(err) console.log(err);
// 			else resolve();
// 		})
// 	})
// }

const timeout = ms => new Promise(res => setTimeout(res, ms))

async function initiateSession() {
	return new Promise((resolve, reject) => {
		console.log('Initiating Session');
		wsc.send(JSON.stringify({
			"op": "request",
			"uri": "/rms/goToMap",
			"args": {
				"name": "AvaRoboticsHQ_09-20-17"
			}
		}),function(err){
			if(err) {
				console.log(err);
			}
			else {
				resolve();
			} 
		})
	})
}

async function callUser() {
	return new Promise((resolve, reject) => {
		console.log('Calling User');
		let jsonData = {"op":"request","uri":"/robot/tel/dial","args":{"number":"cbleeker@go.webex.com"}}
		wsc.send(JSON.stringify(jsonData),function(err){
			if(err) {
				console.log(err)
			}
			else {
				return;
			} 
		})
	})
}

async function moveToDestination() {
	return new Promise((resolve, reject) => {
		console.log('Moving to destination');
		let jsonData = {"op":"request", "uri":"/robot/tel/goToRoom", "args":{"map":"AvaRoboticsHQ_09-20-17","room":"Mirror","waypoint":{"id":1450}}}
		wsc.send(JSON.stringify(jsonData),function(err){
			if(err) console.log(err);
			else return;
		})
	})
}

async function endAvaSession() {
	let [foo, bar] = await Promise.all([unsubAll(), endSession()]);
	return [foo, bar];
}

async function unsubAll() {
	return new Promise((resolve, reject) => {
		let unsubjsonData = {
			"op": "unsubscribe",
			"uri": "/rms/sessionStateUpdate"	
		}
	
		wsc.send(JSON.stringify(unsubjsonData),function(err){
			if(err) console.log(err);
			else {
				console.log('Unsubbed')
				resolve();
			}
		})
	})
}

async function endSession(params) {
	return new Promise((resolve, reject) => {
		let endjsonData = {
			"op": "request",
			"uri": "/rms/endSession" 
		}
	
		wsc.send(JSON.stringify(endjsonData), function(err){
			if(err) console.log(err);
			else {
				console.log('Ended Session')
				resolve();
			}
		})
	})	
}

async function setupInit() {
	await timeout(2000);
	let initSession = await initiateSession();
	// await timeout(2000);
	let callUserResponse = await callUser();
	await timeout(10000);
	let moveToDestinationResponse = await moveToDestination();
	return 'Init completed';
}

// process.on('SIGTERM', async function onSigterm () {
// 	console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
// 	// start graceul shutdown here
// 	await endAvaSession();
// 	shutdown()
//   })

var signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
	for (i in signals) {
		process.on(signals[i], async function() {
		console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
		// start graceul shutdown here
		let endAvaSessionResponse = await endAvaSession();
		await timeout(1000);
		process.exit(0);
	});
}