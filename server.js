const uuid        = require('uuid');
const WebSocket   = require('ws');
const { Player }  = require('./src/js/player.js');
const { getName } = require('./src/js/utils/names.js');
const { getColor } = require('./src/js/utils/colors.js');

const mmdt = (type, data) => JSON.stringify({ type, data }); //make me data type

const server = new WebSocket.Server({ 
  port: 8081,
});

let clients = new Map();
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

  if (ws.data.guessedCard === undefined)
    readyPlayers++;
  ws.data.guessedCard = card;

  if (readyPlayers === server.clients.size) {
    compress();
    server.sendAll(mmdt('choosedCards', turnResults));
    server.sendAll(mmdt('gameUpdate', 'turn results'));
  }
});

server.requestHandlers.set('clientId', (ws, id) => {
  let lostPlayer = lostPlayers.get(id);
  //console.log(
    //`Client id recieved: ${id}. Is player found: ${lostPlayer !== undefined}`);

  if (lostPlayer !== undefined) {
    //console.log('resurrecting old player. ' + lostPlayer.name);
    ws.data = lostPlayer;
    lostPlayers.delete(id);
    server.sendAllBut(mmdt('statusUpdate', 
      { id: ws.data.id, status: ws.data.status }), ws);
  }
  else {
    //console.log('creating new player');
    ws.data = new Player(uuid.v4(), getName(), getColor());
    ws.data.removed = true;
    ws.send(mmdt('yourId', ws.data.id));
  }
  clients.set(ws.data.id, ws.data);
  //console.log();

  if (ws.data.removed) {
    server.sendAllBut(mmdt('newClient', ws.data), ws);
    ws.data.removed = false;
  }

  let playerBase = Array.from(clients, client => client[1]);
  ws.send(mmdt('baseUpdate', playerBase));
});

let lostPlayers = new Map();
//======================SERVER ON CONNECTION=====================//
server.on('connection', (ws) => {
  ws.isAlive = true;
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
    if (ws.data === undefined) return;
    lostPlayers.set(ws.data.id, ws.data);
    //console.log('Connection lost with ' + ws.data.name);

    server.sendAllBut(mmdt('statusUpdate', { id: ws.data.id, status: 'offline' }), ws);

    setTimeout(() => { 
      if (lostPlayers.has(ws.data.id)) {
        ws.data.removed = true;
        server.sendAllBut(mmdt('removeClient', ws.data.id), ws);
        clients.delete(ws.data.id);
        console.log('Sending reuqest to delete client ' + ws.data.name);
      }
    }, 10000);

    setTimeout(() => { 
      if (lostPlayers.delete(ws.data.id))
        console.log(`${ws.data.name} was deleted completly`);
    }, 30000);
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
