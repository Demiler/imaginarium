const uuid        = require('uuid');
const WebSocket   = require('ws');
const { Player }  = require('../src/js/player.js');
const { getName } = require('../src/js/utils/names.js');
const { getColor } = require('../src/js/utils/colors.js');
const { cardsDB } = require('./cards-db.js');
const { log } = require('./logger.js');

const mmdt = (type, data) => JSON.stringify({ type, data }); //make me data type
log.setLog('sgenera', true);
log.setLog('sclient', true);

const server = new WebSocket.Server({ 
  port: 8081,
});

//===========================CONFIG=============================//
let clientBase = new Map();
let lostPlayers = new Map();
let cards = [];
let turnResults = []
let compressed = false;
let readyPlayers = 1;
let firstTurn = true;
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

server.requestHandlers.set('newTurn', () => {
  readyPlayers = 1;
  cards = [];
  compressed = false;

  if (!firstTurn) { 
    let newCards = cardsDB.getNCards(clientBase.size);

    server.clients.forEach(client => {
      client.data.guessedCard = undefined;
      client.send(mmdt('cardsUpdate', { 
        remove: client.data.choosedCard,
        add: newCards.pop().path,
      }));
      client.data.choosedCard = undefined;
    });
  }
  firstTurn = false;
});

//======================SERVER ON CLIENT=====================//
server.requestHandlers.set('clientId', (ws, id) => {
  if (clientBase.has(id) && !lostPlayers.has(id)) {
    log.do('sclient', 'Same client opened game in another tab');
    ws.send(mmdt('close this tab'));
    return;
  }
  ws.disconnected = false;

  let lostPlayer = lostPlayers.get(id);
  log.do('sclient',
    `Client id recieved: ${id}. Is player found: ${lostPlayer !== undefined}`);

  if (lostPlayer !== undefined) {
    log.do('sclient', 'resurrecting old player. ' + lostPlayer.name);
    ws.data = lostPlayer;
    lostPlayers.delete(id);
    server.sendAllBut(mmdt('statusUpdate', 
      { id: ws.data.id, status: ws.data.status }), ws);
  }
  else {
    ws.data = new Player(uuid.v4(), getName(), getColor());
    ws.data.cards = cardsDB.getNCards(6).map(card => card.path);
    log.do('sclient', `creating new player ${ws.data.id}. ${ws.data.name}`);

    ws.data.removed = true;
    ws.send(mmdt('yourId', ws.data.id));
  }
  clientBase.set(ws.data.id, ws.data);
  log.do('sclient', '\n');

  if (ws.data.removed) {
    server.sendAllBut(mmdt('newClient', ws.data), ws);
    ws.data.removed = false;
  }

  let playerBase = Array.from(clientBase, client => client[1]);
  ws.send(mmdt('baseUpdate', playerBase));
  ws.send(mmdt('cards', ws.data.cards));
});

//======================SERVER ON CONNECTION=====================//
server.on('connection', (ws) => {
  ws.isAlive = true;
  ws.disconnected = true;
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
    onDisconnect(ws);
  });
});

function onDisconnect(ws) {
  lostPlayers.set(ws.data.id, ws.data);
  //console.log('Connection lost with ' + ws.data.name);

  server.sendAllBut(mmdt('statusUpdate', { id: ws.data.id, status: 'offline' }), ws);

  setTimeout(() => { 
    if (lostPlayers.has(ws.data.id)) {
      ws.data.removed = true;
      server.sendAllBut(mmdt('removeClient', ws.data.id), ws);
      clientBase.delete(ws.data.id);
      console.log('Sending reuqest to delete client ' + ws.data.name);
    }
  }, 10000);

  setTimeout(() => { 
    if (lostPlayers.delete(ws.data.id))
      console.log(`${ws.data.name} was deleted completly`);
  }, 30000);
}

//========================SERVER PINGER========================//
const pinger = setInterval(() => {
  server.clients.forEach((client) => {
    if (!client.isAlive && !client.disconnected) {
      log.do('sclient', `${client.data.name} is not responding`);
      client.disconnected = true;
      onDisconnect(client);
      return;
    }

    client.isAlive = false;
    client.send('__ping__');
  });
}, 10000);
