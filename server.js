const uuid        = require('uuid');
const WebSocket   = require('ws');
const { Player }  = require('./src/js/player.js');
const { getName } = require('./src/js/utils/names.js');

const mmdt = (type, data) => JSON.stringify({ type, data }); //make me data type

const server = new WebSocket.Server({ 
  port: 8081,
});

//=========================SERVER SEND==========================//
server.sendAll = (data) => {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN)
      client.send(data);
  });
};

server.sendAllBut = (data, ignoreClient) => {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== ignoreClient)
      client.send(data);
  });
};

//========================SERVER REQUESTS========================//
server.requestHandlers = new Map();
server.requestHandlers.set('statusUpdate', (ws, status) => {
  ws.data.status = status;
  server.sendAllBut(mmdt('statusUpdate', {id: ws.data.id, status}), ws);
});

//======================SERVER ON CONNECTION=====================//
server.on('connection', (ws) => {
  ws.data = new Player(uuid.v4(), getName());
  ws.isAlive = true;

  let playerBase = Array.from(server.clients, (client) => client.data);

  ws.send(mmdt('yourId', ws.data.id));
  ws.send(mmdt('baseUpdate', playerBase));
  server.sendAllBut(mmdt('newClient', ws.data), ws);

//=====================SOCKET EVENTS INIT======================//
  ws.on('message', (data) => {
    if (data === '__pong__') { 
      //console.log(ws.sendableData.name + ' pong');
      ws.isAlive = true;
    }
    else if (data.startsWith('server')) {
      const split = data.split(' ');
      const handler = server.requestHandlers.get(split[1]);
      if (handler === undefined)
        return console.log('unknown server request ' + data);
      handler(ws, split[2]);
    }
    else
      server.sendAllBut(data, ws);
  });

  ws.on('close', () => {
    server.sendAllBut(mmdt('removeClient', ws.data.id), ws);
  });
});


//========================SERVER PINGER========================//
const pinger = setInterval(() => {
  server.clients.forEach((client) => {
    if (!client.isAlive) return console.log(client.name + ' is not responding');

    client.isAlive = false;
    client.send('__ping__');
  });
}, 10000);
