const WebSocket = require('ws');
global.WebSocket = WebSocket;
// const Sockette = require('sockette');

var testObject = {
    "op": "request",
    "uri": "/rms/ping"
    // "args": {
    //     "id": 8514
    // }
}

const ReconnectingWebSocket = require('reconnecting-websocket');
 
socketProtocols = 'irobot-bcr-scheduler';

const rws = new ReconnectingWebSocket('wss://clusdevi:clus!devi1@cisco.ava8.net/client', socketProtocols);

rws.addEventListener('open', () => {
    console.log('Socket connected...');
    rws.send(JSON.stringify(testObject));
});

rws.addEventListener('message', (message) => {
    console.log(message.data);
});

rws.addEventListener('error', (message) => {
    console.log('error');
    console.log(message);
});

rws.addEventListener('close', (message) => {
    console.log('closed');
    console.log(message);
});

// const ws = new Sockette('wss://clusdevi:clus!devi1@cisco.ava8.net/client', {
//     protocols: 'irobot-bcr-scheduler',
//     timeout: 5e3,
//     maxAttempts: 10,
//     onopen: e => console.log('Connected!', e),
//     onmessage: e => console.log('Received:', e),
//     onreconnect: e => console.log('Reconnecting...', e),
//     onmaximum: e => console.log('Stop Attempting!', e),
//     onclose: e => console.log('Closed!', e),
//     onerror: e => console.log('Error:', e)
// });



// // ws.send('Hello, world!');
// ws.json(testObject);
// // ws.close(); // graceful shutdown

// // Reconnect 10s later
// // setTimeout(ws.reconnect, 10e3);