const WebSocket = require('ws');
const uuid = require('uuid');
const { log } = require('./logger.js');
const { Player }  = require('../src/js/player.js');
const { getName } = require('../src/js/utils/names.js');
const { getColor } = require('../src/js/utils/colors.js');
const { cardsDB } = require('./cards-db.js');
const { shuffle } = require('./shuffle.js');

//============================LOGS==============================//
log.setLog('spipo', false);
log.setLog('serror', true);
log.setLog('sclient', true);
log.setLog('shandler', true);
//===========================CONFIG=============================//
const server = new WebSocket.Server({
  port: 8081,
});

let clientBase = new Map();
let lostClients = new Map();

clientBase.every = (cb) => {
  for (let [, client] of clientBase)
    if (!cb(client)) return false;
  return true;
}

clientBase.some = (cb) => {
  for (let [, client] of clientBase)
    if (cb(client)) return true;
  return false;
}

clientBase.updateEveryoneStatus = (status) => {
 clientBase.forEach(client => {
  if (client.player.status === 'offline')
    client.player.statusBeforeOffline = status;
  else
    client.player.status = status;
  });
}
//============================APP===============================//
let app = {
  state: 'lobby',
  leader: 0,
  leaderGuess: '',
  order: [],
  cards: [],
  readyPlayers: 0,

  newTurn() {
    app.readyPlayers = 0;
    app.cards = [];
    app.leader = (app.leader + 1) % clientBase.size;
    app.leaderGuess = '';
    let newCards = cardsDB.getNCards(clientBase.size);
    server.clients.forEach(ws => {
      ws.say('newTurn', {
        leader: app.leader,
        addCard: newCards.pop(),
        removeCard: ws.data.choosenCard,
      });
      ws.data.choosenCard = undefined;
    });
  },

  initGame() {
    app.state = 'game';
    app.order = shuffle(Array.from(Array(clientBase.size).keys()));
    server.clients.forEach(ws => {
      ws.data.cards = cardsDB.getNCards(6);
      ws.say('gameInit', {
        order: app.order,
        leader: app.leader,
        cards: ws.data.cards,
      });
    });
    clientBase.updateEveryoneStatus('waiting-for-leader');
  }
 
}
//==========================HANDLERS============================//
server.handlers = new Map();
server.handleRequest = (ws, data) => {
  const type = data.split(' ')[0]; 
  const msg = data.substr(type.length + 1);
  const handler = server.handlers.get(type);
  log.do('shandler', `Received handler '${type}' with '${msg}'`);

  if (handler) handler(ws, msg);
  else log.do('serror', `Handler '${type}' not found`);
}

server.handlers.set('connected', (ws, id) => handleClient(ws, id));

server.handlers.set('lobbyUpdate', (ws, status) => {
  server.updateClientStatus(ws, status);
  if (clientBase.every(cl => cl.player.status === 'ready')) 
    app.initGame();
});

server.handlers.set('statusUpdate', (ws, status) => {
  server.updateClientStatus(ws, status);
});

server.handlers.set('leaderGuess', (ws, guess) => {
  app.leaderGuess = guess;
  server.sendAllBut('leaderGuess', guess, ws);
  clientBase.updateEveryoneStatus('picking');
  server.sendAll('allStatusUpdate', 'picking');
  server.updateClientStatus(ws, 'waiting-for-others');
});

server.handlers.set('choosenCard', (ws, choosenCard) => {
  ws.data.choosenCard = choosenCard;
  if (clientBase.every(cl => cl.choosenCard !== undefined)) {
    app.cards = Array.from(clientBase.values(), cl => { return {path: cl.choosenCard} } );
    clientBase.updateEveryoneStatus('thinkig');
    server.sendAll('guessLeaderCard', app.cards);
  }
});

server.handlers.set('guessedCard', (ws, guessedCard) => {
  if (ws.data.guessedCard === undefined)
    app.readyPlayers++;
  ws.data.guessedCard = guessedCard;

  if (app.readyPlayers + 1 === clientBase.size) {
    app.turnCards = Array.from(clientBase.values(), cl => {
      let choose = {
        owner: cl.player,
        card: { path: cl.choosenCard },
        players: [], 
      }
      clientBase.forEach(cl => {
        if (cl.guessedCard === choose.card.path)
          choose.players.push(cl.player);
      });
      return choose;
    });
    server.sendAll('turnResults', app.turnCards);
    setTimeout(() => app.newTurn(), 10000);
  }
});

server.handlers.set('removeCard', (ws) => {
  ws.data.guessedCard = undefined;
  app.readyPlayers--;
});

server.handlers.set('IWantNewColor', (ws) => {
  ws.data.player.color = getColor();
  server.sendAll('colorUpdate', { id: ws.data.player.id, color: ws.data.player.color });
});

//======================CONNECTION SETUP========================//
server.on('connection', ws => {
  ws.isAlive = true;    //used for ping-pong
  ws.isActive = false;  //used for detecting same client 

  ws.say = (type, data) => ws.send(JSON.stringify({ type, data }));

  ws.on('message', (data) => {
    if (data.startsWith('server'))
      server.handleRequest(ws, data.substr(7)); //7 = 'server '.length
    else
      server.sendAllButRaw(data, ws)
  });

  ws.on('close', () => {
    if (!ws.isActive) return;
    log.do('sclient', `Connection lost with ${ws.data.player.name}`);
    handleDisconnect(ws);
  });

  ws.on('pong', () => {
    ws.isAlive = true;
    log.do('spipo', 'Cleint pong');
  });
});

//========================PING CLIENT===========================//
server.pinger = setInterval(() => {
  server.clients.forEach(client => {
    if (!client.isActive) return;
    if (!client.isAlive) {
      log.do('spipo', 'Client not respoding');
      handleDisconnect(client);
    }
    client.isAlive = false;
    client.ping()
  });
}, 10000);

//=======================HANDLE CLIENT==========================//
const handleClient = (ws, id) => {
  if (clientBase.has(id) && !lostClients.has(id)) {
    log.do('sclient', 'Same client opened game in another tab');
    ws.say('closeThisTab');
    return;
  }

  let lostClient = lostClients.get(id);
  log.do('sclient',
    `Client id recieved: ${id}. Is client found: ${lostClient !== undefined}`);

  if (lostClient !== undefined) {
    ws.data = lostClient;
    lostClients.delete(id);
    clearTimeout(ws.data.timeouts.offline);
    clearTimeout(ws.data.timeouts.remove);
    clearTimeout(ws.data.timeouts.delete);

    if (ws.data.removed) {
      ws.data.player.status = ws.data.player.statusBeforeOffline;
      server.sendAllBut('addClient', ws.data.player, ws);
    }
    else if (ws.data.player.status === 'offline')
      server.updateClientStatus(ws, ws.data.player.statusBeforeOffline);
    
    ws.data.removed = false;
    log.do('sclient', `Resurrecting old player. ${ws.data.player.name}`);
  }
  else {
    ws.data = {
      removed: false,
      player: new Player(uuid.v4(), getName(), getColor()),
      cards: [],
      timeouts: {},
    };
    server.sendAllBut('addClient', ws.data.player, ws);
    log.do('sclient', `Creating new player ${ws.data.player.id}. ${ws.data.player.name}`);
  }

  ws.isActive = true;
  clientBase.set(ws.data.player.id, ws.data);

  ws.say('setup', {
    players:      Array.from(clientBase.values(), client => client.player),
    cards:        ws.data.cards,
    id:           ws.data.player.id,
    appState:     app.state,
    leader:       app.leader,
    leaderGuess:  app.leaderGuess,
    order:        app.order,
  });
  log.do('sclient');
}
//=====================HANDLE DISCONNECT========================//
const handleDisconnect = (ws) => {
  lostClients.set(ws.data.player.id, ws.data);

  ws.data.timeouts.offline = setTimeout(() => {
    ws.data.player.statusBeforeOffline = ws.data.player.status;
    server.updateClientStatus(ws, 'offline');
  }, 400);

  ws.data.timeouts.remove = setTimeout(() => { 
    if (!lostClients.has(ws.data.player.id)) return;
    ws.data.removed = true;
    server.sendAllBut('removeClient', ws.data.player.id, ws);
    clientBase.delete(ws.data.player.id);
    log.do('sclient', `Sending reuqest to delete client ${ws.data.player.name}`);
  }, 10000);

  ws.data.timeouts.delete = setTimeout(() => { 
    if (!lostClients.delete(ws.data.player.id)) return;
    log.do('sclient', `${ws.data.player.name} was deleted completly`);
  }, 30000);
}

//==========================SENDERS=============================//
server.sendAllBut = (type, data, ignoreClient) => {
  server.clients.forEach(client => {
    if (client !== ignoreClient && client.isActive) 
      client.say(type, data);
  });
}

server.sendAll = (type, data) => {
  server.clients.forEach(client => {
    if (client.isActive)
      client.say(type, data)
  });
}

server.sendAllButRaw = (data, ignoreClient) => {
  server.clients.forEach(client => {
    if (client !== ignoreClient && client.isActive) 
      client.send(data);
  });
}

server.updateClientStatus = (ws, status = ws.data.player.status) => {
  ws.data.player.status = status;
  server.sendAllBut('statusUpdate', {
    id: ws.data.player.id,
    status,
  }, ws);
}
