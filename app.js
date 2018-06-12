const WebSocket = require('ws');
var protocols = 'irobot-bcr-scheduler';
// var protocols = '';
var socketURL = 'wss://cisco.ava8.net/client';
// var socketServer = 'wss://echo.websocket.org';
var socketOptions = {
    headers : {
        Authorization: "Basic Y2x1c2Rldmk6Y2x1cyFkZXZpMQ=="
    }
}


const ws = new WebSocket (socketURL,protocols, {
    headers : {
        Authorization: "Basic Y2x1c2Rldmk6Y2x1cyFkZXZpMQ=="
    }
})

ws.on('open', function open() {
    console.log('Connection opened.')
    testObject = {
        "op": "request",
        "uri": "/rms/ping"
        // "args": {
        //     "id": 8514
        // }
    }
    // setTimeout(() => {
    //     ws.ping('ping',function(err){
    //         if (!err) {
    //             console.log('Ping sent');
    //         }
    //         else {
    //             console.log('WS ping failed - check connection status');
    //         }
    //     })
    // }, 30000);
    


    keepAlive = setInterval(() => {
        // ws.send(JSON.stringify(testObject), function(err){
        //     if (!err){
        //         console.log('data sent');
        //     }
        // });


        ws.ping('ping',function(err){
            if (!err) {
                console.log('Ping sent');
            }
            else {
                console.log('WS ping failed - check connection status');
            }
        })
    }, 15e3);


    // setTimeout(() => {
    //     clearInterval(keepAlive)
    // }, 20000);
});

ws.on('message', function incoming(data) {
    console.log(data);
});

ws.on('pong', function incoming(data) {
    console.log(`pong received. Data is ${data}`);
});

ws.on('ping', function incoming(data) {
    console.log('ping received.');
    console.log(data);
    // ws.pong('pong',function(err){
    //     if (!err) {
    //         console.log('Pong sent');
    //     }
    //     else {
    //         console.log('WS pong failed - check connection status');
    //     }
    // })
});

ws.on('error', function incoming(data) {
    console.log('error');
    console.log(data);

});

ws.on('unexpected-response', function incoming(request,response) {
    console.log('unexpected response');
    console.log(response.statusCode);
});

ws.on('close', function incoming(code,reason) {
    console.log('WS closed');
    console.log(code);
    console.log(reason);
});


































// function WebSocketClient(){
// 	this.number = 0;	// Message number
// 	this.autoReconnectInterval = 5*1000;	// ms
// }
// WebSocketClient.prototype.open = function(url,protocols,socketOptions){
//     this.url = url;
//     this.protocols = protocols;
//     this.socketOptions = socketOptions;
// 	this.instance = new WebSocket(this.url, this.protocols, this.socketOptions);
// 	this.instance.on('open',()=>{
// 		this.onopen();
// 	});
// 	this.instance.on('message',(data,flags)=>{
// 		this.number ++;
// 		this.onmessage(data,flags,this.number);
// 	});
// 	this.instance.on('close',(e)=>{
// 		switch (e.code){
// 		case 1000:	// CLOSE_NORMAL
// 			console.log("WebSocket: closed");
// 			break;
// 		default:	// Abnormal closure
// 			this.reconnect(e);
// 			break;
// 		}
// 		this.onclose(e);
// 	});
// 	this.instance.on('error',(e)=>{
// 		switch (e.code){
// 		case 'ECONNREFUSED':
// 			this.reconnect(e);
// 			break;
// 		default:
// 			this.onerror(e);
// 			break;
// 		}
// 	});
// }
// WebSocketClient.prototype.send = function(data,option){
// 	try{
// 		this.instance.send(data,option);
// 	}catch (e){
// 		this.instance.emit('error',e);
// 	}
// }
// WebSocketClient.prototype.reconnect = function(e){
// 	console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
//         this.instance.removeAllListeners();
// 	var that = this;
// 	setTimeout(function(){
// 		console.log("WebSocketClient: reconnecting...");
// 		that.open(that.url,that.protocols,that.socketOptions);
// 	},this.autoReconnectInterval);
// }
// WebSocketClient.prototype.onopen = function(e){	console.log("WebSocketClient: open",arguments);	}
// WebSocketClient.prototype.onmessage = function(data,flags,number){	console.log("WebSocketClient: message",arguments);	}
// WebSocketClient.prototype.onerror = function(e){	console.log("WebSocketClient: error",arguments);	}
// WebSocketClient.prototype.onclose = function(e){	console.log("WebSocketClient: closed",arguments);	}

// var wsc = new WebSocketClient();
// wsc.open(socketURL,protocols,socketOptions);
// wsc.onopen = function(e){
// 	console.log("WebSocketClient connected:",e);
//     // this.send("Hello World !");
//     testObject = {
//         "op": "request",
//         "uri": "/rms/ping"
//         // "args": {
//         //     "id": 8514
//         // }
//     }
//     wsc.send(JSON.stringify(testObject), function(err){
//         if (!err){
//             console.log('data sent');
//         }
//     });
// }
// wsc.onmessage = function(data,flags,number){
// 	console.log(`WebSocketClient message #${number}: `,data);
// }