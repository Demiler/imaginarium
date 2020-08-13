const { Player } = require('./player.js');
const getIP = () => {
  return (document.location !== 'https://ma-chose.herokuapp.com/') ?
    'wss://localhost:8081' : 'wss://ma-chose.herokuapp.com';
}

class Api {
  constructor() {
    this.handlers = new Map()
    this.tries = 0;

    this.on = (type, handler) => {
      if (!this.handlers.has(type)) this.handlers.set(type, [])
      this.handlers.get(type).push(handler)
    }

    this.subscriptions = new Map();
    this.subscribe = (sub, handler) => 
      this.subscriptions.set(sub, handler);
    this.unsubscribe = (from) =>
      this.subscriptions.delete(from);
    this.publish = (sub, data) => {
      if (this.subscriptions.has(sub))
        this.subscriptions.get(sub)(data);
      else
        console.log(`'${sub}' subscription is not found`);
    };


    this.send = (type, data) =>
      this.ws.send(JSON.stringify({ type, data }));

    this.sendServer = (type, data) => {
      if (typeof data === "string")
        this.ws.send(`server ${type} ${data}`);
      else
        this.ws.send(`server ${type} ${JSON.stringify(data)}`);
    }

    this.conect();
  }

  conect() {
    this.ws = new WebSocket(getIP());

    this.ws.onopen = () => {
      console.log('WebSocket is open now');
      this.tries = 0;
      clearInterval(this.reconnect);
      this.sendServer('connected', localStorage.getItem('id'));
    }

    this.ws.onclose = () => {
      console.log('WebSocket is closed now');
      this.reconnect = setInterval(() => {
        if (this.tries < 3) {
          this.tries++;
          this.conect();
          console.log('Trying to reconnect');
        }
        else {
          console.log('Im dead');
          clearInterval(this.reconnect);
        }
      }, 1000);
    }

    this.ws.onerror = () => {
      console.log('Some sort of error in WebSocket');
      clearInterval(this.reconnect);
    }

    this.ws.onmessage = (event) => {
      console.log(event);
      let data = JSON.parse(event.data);
      if (this.handlers.has(data.type)) 
        this.handlers.get(data.type).forEach(handler => handler(data.data));
      else {
        console.log('Unknown type of event: ' + data.type);
        console.log(data.data);
      }
    }
  }

  setHost(data) {
    this.host = this.players.find(pl => pl.id === data.id);
    this.host.cards = data.cards;

    this.host.updateStatus = (newStatus) => {
      this.host.status = newStatus;
      this.sendServer('statusUpdate', newStatus);      
      this.publish('update');
    };
  }
}

export const api = new Api();

api.on('setup', (data) => {
  api.players = data.players.map(pl => Player.fromJSON(pl));
  api.setHost(data);
  if (data.appState === 'game') {
    api.leader = api.players[data.leader];
    api.leader.guess = data.leaderGuess;
  }
  api.cards = data.appCards;
  localStorage.setItem('id', data.id);
  api.publish('setup ready', data.appState);
});

api.on('statusUpdate', (data) => {
  let player = api.players.find(pl => pl.id === data.id);
  player.status = data.status;
  api.publish('update');
});

api.on('addClient', (player) => {
  api.players.push(Player.fromJSON(player));
  api.publish('update');
});

api.on('removeClient', (id) => {
  let playerInd = api.players.findIndex(pl => pl.id === id);
  let lastInd = api.players.length - 1;
  api.players[playerInd] = api.players[lastInd];
  api.players.pop();
  api.publish('update');
});

api.on('allStatusUpdate', (status) => {
  api.players.forEach(player => {
    if (player.status !== 'offline')
      player.status = status.all;
  });
  api.leader.status = status.leader;
  api.publish('update');
});

api.on('gameInit', (data) => {
  api.players = data.order.map(pl => Player.fromJSON(pl));
  api.setHost(data);
  api.leader = api.players[data.leader];
  api.leader.guess = '';
  //api.players.forEach(pl => pl.status = 'waiting-for-leader');

  api.publish('game');
});

api.on('updateScore', (data) => {
  data.forEach(pl => {
    api.players
      .find(player => player.id === pl.id)
      .score = pl.score;
  });
  api.publish('update');
});
