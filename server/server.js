const WebSocket = require('ws');
const uuid = require('uuid');
const { log } = require('./logger.js');
const { Player }  = require('../src/js/player.js');
//const { getName } = require('../src/js/utils/names.js');
const { getColor } = require('../src/js/utils/colors.js');
const { cardsDB } = require('./cards-db.js');
const { shuffle } = require('./shuffle.js');
const { clientArray } = require('./client-array.js');
const http = require('http');
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')

//============================LOGS==============================//
log.setLog('spipo', false);
log.setLog('serror', true);
log.setLog('sclient', true);
log.setLog('shandler', true);
//===========================SERVER=============================//

const serve = serveStatic('build', { 'index': ['index.html'] })
 
const server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})
const wss = new WebSocket.Server({ server });
server.listen(process.env.PORT || 8081);

//===========================CONFIG=============================//

let clientBase = new Map();
let activeClients = new clientArray();
let lostClients = new Map();

activeClients.updateEveryoneStatus = (status, leaderStatus) => {
 activeClients.forEach(client => {
  if (client.player.status === 'offline')
    client.player.statusBeforeOffline = status;
  else
    client.player.status = status;
  });
  if (leaderStatus) app.leader.player.status = leaderStatus;
}
//============================APP===============================//
let app = {
  state: 'lobby',
  leader: {},
  leaderId: 0,
  leaderGuess: '',
  cards: [],
  readyPlayers: 0,

  newTurn() {
    app.readyPlayers = 0;
    app.cards = [];
    app.leaderId = (app.leaderId + 1) % activeClients.length;
    app.leader = activeClients[app.leaderId];
    app.leaderGuess = '';
    let newCards = cardsDB.getNCards(activeClients.length);
    wss.clients.forEach(ws => {
      ws.say('newTurn', {
        leader: app.leaderId,
        addCard: newCards.pop(),
        removeCard: ws.data.choosenCard,
      });
      ws.data.choosenCard = undefined;
      ws.data.guessedCard = undefined;
    });
    activeClients.updateEveryoneStatus('waiting-for-leader', 'guessing');
  },

  initGame() {
    app.state = 'game';
    shuffle(activeClients);
    app.leader = activeClients[app.leaderId];
    activeClients.updateEveryoneStatus('waiting-for-leader', 'guessing');
    wss.clients.forEach(ws => {
      ws.data.cards = cardsDB.getNCards(6);
      ws.say('gameInit', {
        id: ws.data.player.id,
        order: activeClients,
        leader: app.leaderId,
        cards: ws.data.cards,
      });
    });
  }
 
}
//==========================HANDLERS============================//
wss.handlers = new Map();
wss.handleRequest = (ws, data) => {
  const [ type ] = data.split(' ');
  const msg = data.substr(type.length + 1);
  const handler = wss.handlers.get(type);
  log.do('shandler', `Received handler '${type}' with '${msg}'`);

  if (handler) handler(ws, msg);
  else log.do('serror', `Handler '${type}' not found`);
}

//wss.handlers.set('connected', (ws, id) => handleClient(ws, id));
wss.handlers.set('connected', (ws, login) => {
  if (clientBase.has(login))
    handleClient(ws, login);
  else
    ws.say('login');
});

wss.handlers.set('lobbyUpdate', (ws, status) => {
  wss.updateClientStatus(ws, status);
  if (activeClients.every(cl => cl.player.status === 'ready')) 
    app.initGame();
});

wss.handlers.set('statusUpdate', (ws, status) => {
  wss.updateClientStatus(ws, status);
});

wss.handlers.set('leaderGuess', (ws, guess) => {
  app.leaderGuess = guess;
  wss.sendAllBut('leaderGuess', guess, ws);
  activeClients.updateEveryoneStatus('picking', 'waiting-for-others');
  wss.sendAll('allStatusUpdate', { all: 'picking', leader: 'waiting-for-others' });
});

wss.handlers.set('choosenCard', (ws, choosenCard) => {
  ws.data.choosenCard = JSON.parse(choosenCard);
  if (activeClients.every(cl => cl.choosenCard !== undefined)) {
    app.cards = activeClients.mapa(cl => cl.choosenCard);
    activeClients.updateEveryoneStatus('thinking', 'waiting');
    wss.sendAll('guessLeaderCard', app.cards);
  }
  else if (ws.data.player.id !== app.leader.player.id)
    wss.updateClientStatus(ws, 'waiting-for-others');
});

wss.handlers.set('guessedCard', (ws, guessedCard) => {
  ws.data.guessedCard = JSON.parse(guessedCard);
  const readyPlayers = activeClients.reduce((rp, cl) => {
    return rp + (cl.guessedCard !== undefined);
  }, 0);

  if (readyPlayers + 1 === activeClients.length) {
    app.cards = activeClients.mapa(cl => {
      let choose = {
        owner: cl.player,
        card: cl.choosenCard,
        players: [], 
      }
      activeClients.forEach(cll => {
        if (cll.guessedCard === undefined) return;
        if (cll.guessedCard.id === choose.card.id)
          choose.players.push(cll.player);
      });

      if (cl.player.id !== app.leader.player.id) {
        cl.player.score += choose.players.length;
        if (cl.guessedCard.id === app.leader.choosenCard.id)
          cl.player.score += 3;
      }
      else if (choose.players.length + 1 !== activeClients.length)
        cl.player.score += choose.players.length;

      return choose;
    });
    wss.sendAll('turnResults', app.cards);
    wss.sendAll('updateScore', activeClients.mapa(cl => {
      return {
        id: cl.player.id,
        score: cl.player.score,
      }
    }));
    setTimeout(() => app.newTurn(), 6000);
  }
});

wss.handlers.set('removeCard', (ws) => {
  ws.data.guessedCard = undefined;
});

wss.handlers.set('IWantNewColor', (ws) => {
  ws.data.player.color = getColor();
  wss.sendAll('colorUpdate', { id: ws.data.player.id, color: ws.data.player.color });
});

wss.handlers.set('userLogin', (ws, data) => {
  data = JSON.parse(data);
  log.do('sclient', `Got new login ${data.user.login}`);

  if (data.type === 'register') {
    if (clientBase.has(data.user.login))
      ws.say('loginUnavailable');
    else {
      log.do('sclient', `Set new client`);
      clientBase.set(data.user.login, data.user.password);
      handleClient(ws, data.user.login);
    }
  }
  else if (data.type === 'login') {
    let client = clientBase.get(data.user.login)
    if (!client)
      ws.say('loginNotFound');
    else if (data.user.password !== client)
      ws.say('incorrectPassword');
    else
      handleClient(ws, data.user.login);
  }
  else log.do('serror', 'Unknown type of userLogin');
});

//======================CONNECTION SETUP========================//
wss.on('connection', ws => {
  ws.isAlive = true;    //used for ping-pong
  ws.isActive = false;  //used for detecting same client 

  ws.say = (type, data) => ws.send(JSON.stringify({ type, data }));

  ws.on('message', (data) => {
    if (!ws.isActive && data.startsWith('server userLogin'))
      wss.handlers.get('userLogin')(ws, data.substr(17)); //17 = 'server userLogin '.length
    else if (data.startsWith('server'))
      wss.handleRequest(ws, data.substr(7)); //7 = 'wss '.length
    else if (ws.isActive)
      wss.sendAllButRaw(data, ws)
  });

  ws.on('close', () => {
    if (!ws.isActive) return;
    log.do('sclient', `Connection lost with ${ws.data.player.name}`);
    handleDisconnect(ws);
  });

  ws.on('pong', () => {
    ws.isAlive = true;
    log.do('spipo', 'Client pong');
  });
});

//========================PING CLIENT===========================//
wss.pinger = setInterval(() => {
  wss.clients.forEach(client => {
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
const handleClient = (ws, login) => {
  if (activeClients.has(login) && !lostClients.has(login)) {
    log.do('sclient', 'Same client opened game in another tab');
    ws.say('closeThisTab');
    return;
  }

  let lostClient = lostClients.get(login);
  log.do('sclient',
    `Client login recieved: ${login}. Is client found: ${lostClient !== undefined}`);

  if (lostClient !== undefined) {
    ws.data = lostClient;
    lostClients.delete(login);
    clearTimeout(ws.data.timeouts.offline);
    clearTimeout(ws.data.timeouts.remove);
    clearTimeout(ws.data.timeouts.delete);

    if (ws.data.removed) {
      ws.data.player.status = ws.data.player.statusBeforeOffline;
      wss.sendAllBut('addClient', ws.data.player, ws);
    }
    else if (ws.data.player.status === 'offline')
      wss.updateClientStatus(ws, ws.data.player.statusBeforeOffline);
    
    ws.data.removed = false;
    log.do('sclient', `Resurrecting old player. ${ws.data.player.login}`);
  }
  else {
    ws.data = {
      removed: false,
      player: new Player(login, uuid.v4(), login, getColor()),
      cards: [],
      timeouts: {},
    };
    wss.sendAllBut('addClient', ws.data.player, ws);
    log.do('sclient', 
      `Creating new player ${ws.data.player.id}. ${ws.data.player.login}`);
  }

  ws.isActive = true;
  activeClients.set(ws.data);

  ws.say('setup', {
    players:      activeClients,
    cards:        ws.data.cards,
    id:           ws.data.player.id,
    appState:     app.state,
    leader:       app.leaderId,
    leaderGuess:  app.leaderGuess,
    appCards:     app.cards,
  });
  log.do('sclient');
}
//=====================HANDLE DISCONNECT========================//
const handleDisconnect = (ws) => {
  lostClients.set(ws.data.player.login, ws.data);

  ws.data.timeouts.offline = setTimeout(() => {
    ws.data.player.statusBeforeOffline = ws.data.player.status;
    wss.updateClientStatus(ws, 'offline');
  }, 400);

  ws.data.timeouts.remove = setTimeout(() => { 
    if (!lostClients.has(ws.data.player.login)) return;
    ws.data.removed = true;
    wss.sendAllBut('removeClient', ws.data.player.id, ws);
    activeClients.delete(ws.data.player.login);
    log.do('sclient', `Sending reuqest to delete client ${ws.data.player.name}`);
  }, 10000);

  ws.data.timeouts.delete = setTimeout(() => { 
    if (!lostClients.delete(ws.data.player.login)) return;
    log.do('sclient', `${ws.data.player.name} was deleted completly`);
  }, 30000);
}

//==========================SENDERS=============================//
wss.sendAllBut = (type, data, ignoreClient) => {
  wss.clients.forEach(client => {
    if (client !== ignoreClient && client.isActive) 
      client.say(type, data);
  });
}

wss.sendAll = (type, data) => {
  wss.clients.forEach(client => {
    if (client.isActive)
      client.say(type, data)
  });
}

wss.sendAllButRaw = (data, ignoreClient) => {
  wss.clients.forEach(client => {
    if (client !== ignoreClient && client.isActive) 
      client.send(data);
  });
}

wss.updateClientStatus = (ws, status = ws.data.player.status) => {
  ws.data.player.status = status;
  wss.sendAllBut('statusUpdate', {
    id: ws.data.player.id,
    status,
  }, ws);
}
