const WebSocket = require('ws');
const { log } = require('./logger.js');
const { getColor } = require('./colors.js');
const { cardsDB } = require('./cards-db.js');
const { shuffle } = require('./shuffle.js');
const { clientArray } = require('./client-array.js');
const { Client } = require('./client.js');
const md5 = require('md5');
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
  },
 
  prepeareTurnCards() {
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
  },
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
wss.handlers.set('connected', (ws, id) => {
  if (clientBase.has(id))
    handleClient(ws, id);
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

  if (readyPlayers + 1 === activeClients.length) 
    app.prepeareTurnCards();
});

wss.handlers.set('removeCard', (ws) => {
  ws.data.guessedCard = undefined;
});

wss.handlers.set('IWantNewColor', (ws) => {
  ws.data.player.color = getColor();
  wss.sendAll('colorUpdate', { id: ws.data.player.id, color: ws.data.player.color });
});

wss.handlers.set('checkLogin', (ws, login) => {
  if (login === '') return;
  ws.say('checkLogin', clientBase.has(login));
});

wss.handlers.set('checkMail', (ws, mail) => {
  if (mail === '') return;
  ws.say('checkMail', clientBase.has(md5(mail)));
});

wss.handlers.set('userLogin', (ws, data) => {
  log.do('shandler', `Recieve handler 'userLogin' with '${data}'`);
  if (!data) return ws.say('incorrectData');

  data = JSON.parse(data);
  //if (!data||!data.user||!data.user.login||!data.user.password||!data.user.remeber) 
    //return ws.say('incorrectData');
  handleLogin(ws, data);
});

//======================CONNECTION SETUP========================//
wss.on('connection', ws => {
  log.do('sclient', 'New client connected');
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
const handleClient = (ws, client) => {
  let { id } = client.profile;
  if (activeClients.has(id) && !lostClients.has(id)) {
    log.do('sclient', 'Same client opened game in another tab');
    ws.say('closeThisTab');
    return;
  }

  ws.data = client;
  //let lostClient = lostClients.get(data.id);
  //log.do('sclient',
    //`Client id recieved: ${data.id}. Is client found: ${lostClient !== undefined}`);

  //if (lostClient !== undefined) {
    //ws.data = lostClient;
    //lostClients.delete(id);
    //ws.data.timeouts.clearAll();

    //if (ws.data.removed) {
      //ws.data.player.status = ws.data.player.statusBeforeOffline;
      //wss.sendAllBut('addClient', ws.data.player, ws);
    //}
    //else if (ws.data.player.status === 'offline')
      //wss.updateClientStatus(ws, ws.data.player.statusBeforeOffline);
    
    //ws.data.removed = false;
    //log.do('sclient', `Resurrecting old player. ${ws.data.player.login}`);
  //}
  //else {
    //ws.data = {
      //removed: false,
      //player: new Player(login, uuid.v4(), login, getColor()),
      //cards: [],
      //timeouts: {},
    //};
    //wss.sendAllBut('addClient', ws.data.player, ws);
    //log.do('sclient', 
      //`Creating new player ${ws.data.player.id}. ${ws.data.player.login}`);
  //}

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

//=======================HANDLE LOGIN===========================//
const handleLogin = (ws, data) => {
  log.do('slogin', `Got new login ${data.user.login}`);

  if (data.type === 'register') {
    if (clientBase.has(data.user.login)) {
      ws.say('loginError', `${data.user.login} is already taken`);
      log.do('slogin', `Attempt to take existent login`);
    }
    else if (clientBase.has(md5(data.user.email))) {
      ws.say('loginError', 'This email is taken');
      log.do('slogin', `Got taken email`);
    }
    else {
      log.do('slogin', `Set new client`);
      const newClient = new Client();
      newClient.generate(data.user.login, data.user.email);
      clientBase.set(newClient.profile.login, newClient);
      clientBase.set(newClient.profile.id, newClient);

      handleClient(ws, newClient);
    }
  }
  else if (data.type === 'login') {
    let client = clientBase.get(data.user.login)
    if (!client) {
      ws.say('loginError', `${data.user.login} is not found`);
      log.do('slogin', `Got uknown login`);
    }
    else if (data.user.password !== client) {
      ws.say('loginError', 'Password is incorrect');
      log.do('slogin', `Got incorrect password`);
    }
    else {
      if (!data.user.remeber)
        ;//start death timeout
      
      handleClient(ws, client);
      log.do('slogin', `User ${data.user.login} has loged in`);
    }
  }
  else log.do('serror', 'Unknown type of userLogin');
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
