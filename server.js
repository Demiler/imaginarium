const uuid        = require('uuid');
const WebSocket   = require('ws');
const { Player }  = require('./src/js/player.js');
const { getName } = require('./src/js/utils/names.js');
const { getColor } = require('./src/js/utils/colors.js');

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

let cards = [];
let turnResults = []
let compressed = false;
const compress = () => {
  if (compressed) return;
  turnResults = Array.from(server.clients, (client) => {
    let player = client.data;
    let choose = {
      owner: player,
      card: player.choosedCard,
      players: []
    };
    server.clients.forEach((client) => {
      if (client.data.guessedCard === choose.card)
        choose.players.push(client.data);
    });
    return choose;
  });
  compressed = true;
}
let readyPlayers = 1;
//========================SERVER REQUESTS========================//
server.requestHandlers = new Map();
server.requestHandlers.set('statusUpdate', (ws, status) => {
  ws.data.status = status;
  server.sendAllBut(mmdt('statusUpdate', {id: ws.data.id, status}), ws);
});

server.requestHandlers.set('choosedCard', (ws, card) => {
  cards.push(card);
  ws.data.choosedCard = card;
});

server.requestHandlers.set('getChoosedCardsNoID', (ws) => {
  ws.send(mmdt('choosedCards', cards));
});

server.requestHandlers.set('removeCard', (ws) => {
  ws.data.guessedCard = undefined;
  readyPlayers--;
  console.log('removing a card');
});

server.requestHandlers.set('guessedCard', (ws, card) => {
  console.log('settings a card');
  if (compressed) return console.log('error!');
  ws.data.guessedCard = card;

  readyPlayers++;
  if (readyPlayers === server.clients.size) {
    compress();
    server.sendAll(mmdt('choosedCards', turnResults));
    server.sendAll(mmdt('gameUpdate', 'turn results'));
  }
});
//======================SERVER ON CONNECTION=====================//
server.on('connection', (ws) => {
  ws.data = new Player(uuid.v4(), getName(), getColor());
  ws.isAlive = true;

  let playerBase = Array.from(server.clients, (client) => client.data);

  server.sendAllBut(mmdt('newClient', ws.data), ws);
  while(ws.readyState !== WebSocket.OPEN);
  ws.send(mmdt('yourId', ws.data.id));
  ws.send(mmdt('baseUpdate', playerBase));

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
