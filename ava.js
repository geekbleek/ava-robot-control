const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var unitySocket = null;
var callConnected = false;
var loopsToRun = 2;
var loopsRan = 0;

//mqtt for testing the triggering
const mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.cisco.com');
client.on('connect', function () {
    console.log('Connected to mqtt broker')
	client.subscribe(['devvie/text']);
	//client.publish('presence', 'Hello mqtt')
});

client.on('message', function (topic, rawMessage) {
	// message is Buffer, parse to JSON
	try {
		var message = JSON.parse(rawMessage);
	} catch(e) {
		console.error('Invalid JSON in MQTT Message'); // error in the above string (in this case, yes)!
		console.error(e);
	}

	if (message) {	
		let mqttResponse = processMQTT();
	}

	async function processMQTT() {
		if (topic == 'devvie/text') {
            let textResponse = await sayText(message.text);
            console.log(textResponse);
		}
	}
});


io.on('connection', function (socket) {
    console.log('Socket.io connectioned opened');
    unitySocket = socket;
    // socket.on('event_name', (data) => {
	// 	onEvent(data);
    // })
});

server.listen(3003, function(err){
	if(!err)
		console.log('Web server started.  Socket available at http://localhost:3003');
});

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
WebSocketClient.prototype.removeEventListener = function(type,listener){
	try{
		this.instance.removeEventListener(type,listener);
	}catch (e){
		this.instance.emit('error',e);
	}
}
WebSocketClient.prototype.addEventListener = function(type,listener){
	try{
		this.instance.addEventListener(type,listener);
	}catch (e){
		this.instance.emit('error',e);
	}
}


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
	console.log(initResponse);

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
				"name": "CLUS2018_devnet_2"
			}
		}),function(err){
			if(err) {
				console.log(err);
			}
			else {
				let destListener = wsc.addEventListener('message', eventListener)
				
				function eventListener(message){
					message = JSON.parse(message.data)
					
					if (message.op === 'response' && message.response.session.id != null) {
						resolve();
						console.log(`Session started.`);
						wsc.removeEventListener('message',eventListener);
					}
				}
			} 
		})
	})
}

async function callUser() {
	return new Promise((resolve, reject) => {
		console.log('Calling User');
		let jsonData = {"op":"request","uri":"/robot/tel/dial","args":{"number":"devvie@tpcall.me"}}
		wsc.send(JSON.stringify(jsonData),function(err){
			if(err) {
				console.log(err)
				reject();
			}
			else {

				let destListener = wsc.addEventListener('message', eventListener)
				
				function eventListener(message){
					message = JSON.parse(message.data)
					
					if (message.op === 'response' && message.uri === "/robot/tel/dial") {
						resolve();
						callConnected = true;
						console.log(`Video call placed.`);
						wsc.removeEventListener('message',eventListener);
					}
				}
			} 
		})
	})
}

async function moveToDestination(mapDestination, wayPoint) {
	return new Promise((resolve, reject) => {
		console.log('Moving to destination');
		if (wayPoint !== null) {
			var jsonData = {"op":"request", "uri":"/robot/tel/goToRoom", "args":{"map":"CLUS2018_devnet_2","room":mapDestination,"waypoint":{"id":wayPoint}}}
		}
		else {
			var jsonData = {"op":"request", "uri":"/robot/dock/dockTag"};
		}
		wsc.send(JSON.stringify(jsonData),function(err){
			if(err) console.log(err);
			else {
				subJSON = {
					"op": "subscribe",
					"reliable": true,
					"uri": "/robot/tel/goToStatus", "rate": 0.2
				}
				wsc.send(JSON.stringify(subJSON),function(err){
					if(err) {
						console.log(err);
						reject();
					}
					else {
						if (mapDestination === "Dock"){
							let destListener = wsc.addEventListener('message', dockEventListener)
						}
						else {
							let destListener2 = wsc.addEventListener('message', eventListener)
						}
						
						
						function eventListener(message){
							message = JSON.parse(message.data)
							if (message.op === 'push' && message.uri === "/robot/tel/goToStatus" && message.response.destination === mapDestination && message.response.status === "SUCCEEDED") {
								resolve();
								console.log(`Done moving to ${mapDestination}`);
								wsc.removeEventListener('message',eventListener);
							}
						}
						
						
						function dockEventListener(message){
							message = JSON.parse(message.data)
							if (message.op === 'push' && message.uri === "/robot/drive/updates" && message.response.status.DockWithWaypoint === "COMPLETE") {
								resolve();
								console.log(`Docked successfully.`);
								wsc.removeEventListener('message',dockEventListener);
							}
						}
						

						
					}
				})
			}
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
	await timeout(5000);
	if (unitySocket !== null) {
		let textResponse = await sayText("Hi there!  I'm Devvie!  Want to come check out some amazing DevNet technology?  Let's go check out the sandbox!");
		
		let initSession = await initiateSession();
		if (callConnected === false) {
			let callUserResponse = await callUser();
		}
		
		let runLoopResponse = await runLoop();

		async function runLoop() {
			if (loopsRan < loopsToRun) {
				let moveToDestinationResponse = await moveToDestination("Greeting", 455);
				await timeout(5000);
				let textResponse2 = await sayText("Hi there!  I'm Devvie!  Want to come check out some amazing DevNet technology?  Let's go check out the sandbox!");
				await timeout(5000);
				let moveToDestinationResponse2 = await moveToDestination("Sandbox", 495);
				await timeout(1000);
				let textResponse3 = await sayText("This is my sandbox.  But I'm not a cat, so don't think anything weird.  It is the DevNet sandbox.  So I guess it is mine.  I love playing in the sand.  Will you play in the sand with me?");
				await timeout(2000);
				let textResponse4 = await sayText("Ok.  I am leaving.  Bye!");
				let moveToDestinationResponse = await moveToDestination("Greeting", 455);
				await timeout(5000);
				let textResponse2 = await sayText("Hi there!  I'm Devvie!  Want to see something really neat?  I swear its a secret no one knows about.  It is my sandbox.  It is where I play with my friends.  You are my friend aren't you?  Let's go!");
				await timeout(1000);
				let moveToDestinationResponse2 = await moveToDestination("Sandbox", 495);
				await timeout(1000);
				let textResponse3 = await sayText("This is my sandbox.  You said you are my friend, so you will play with me right?  Check out the latest Cisco technologies you can interact with her.  Oh, and a sandbox.  A real one.  Play with that too!");
				await timeout(2000);
				let textResponse4 = await sayText("Ok.  I am leaving.  Bye!");
				await timeout(1000);
			}
			else {
				return 'complete';
			}
		
			loopsRan = loopsRan + 1;
			let loopResponse = await runLoop();
		}


		let moveToDockResponse = await moveToDestination("Dock", null);
		
		await timeout(300000);

		// let moveToDestinationResponse2 = await moveToDestination("Sandbox", 495);
		// let textResponse4 = await sayText("Ok.  I am leaving.  Bye!");
		// let moveToDestinationResponse3 = await moveToDestination("Dock", null);

		
		let setupInitResponse = await setupInit();
		return 'Init completed';
	}
	else {
		console.log('unitySocket not connected yet');
		let setupInitResponse = await setupInit();
	}
	

	



	// let callUserResponse = await callUser();
	// await timeout(10000);
	// let moveToDestinationResponse = await moveToDestination();
	
}

async function sayText(sayText) {
    return new Promise((resolve, reject) => {
        console.log('speaking text');
        unitySocket.emit('speak', sayText, false);
        unitySocket.on('sayDone', sayComplete)
        function sayComplete(data) {
            if (data == true) {
                resolve('saying text is done');
                unitySocket.removeListener('sayDone', sayComplete);
            }
            else {
                console.log('invalid sayDone');
            }
        }
    }) 
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