const { Player } = require('./player.js');

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

    this.sendServer = (type, data) => this.ws.send(`server ${type} ${data}`);

    this.conect();
  }

  conect() {
    this.ws = new WebSocket(`ws://192.168.1.67:8081/`);

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
      let data = JSON.parse(event.data);
      if (this.handlers.has(data.type)) 
        this.handlers.get(data.type).forEach(handler => handler(data.data));
      else {
        console.log('Unknown type of event: ' + data.type);
        console.log(data.data);
      }
    }
  }
}

export const api = new Api();

api.on('setup', (data) => {
  api.players = data.players.map(pl => Player.fromJSON(pl));
  api.host = api.players.find(pl => pl.id === data.id);
  api.host.cards = data.cards;

  if (data.appState === 'game') {
    data.order.sort((a, b) => {
      if (a > b) 
        [api.players[b], api.players[a]] =
        [api.players[a], api.players[b]];
      return a > b;
    });

    api.leader = api.players[data.leader];
    api.leader.guess = data.leaderGuess;
  }
  localStorage.setItem('id', data.id);
  api.publish('setup ready', data.appState);

  api.host.updateStatus = (newStatus) => {
    api.host.status = newStatus;
    api.sendServer('statusUpdate', newStatus);      
    api.publish('update');
  };
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
      player.status = status;
  });
  api.publish('update');
});

api.on('gameInit', (data) => {
  data.order.sort((a, b) => {
    if (a > b) 
      [api.players[b], api.players[a]] =
      [api.players[a], api.players[b]];
    return a > b;
  });
  api.leader = api.players[data.leader];
  api.leader.guess = '';
  api.host.cards = data.cards;
  api.players.forEach(pl => pl.status = 'waiting-for-leader');
  if (api.leader.id === api.host.id)
    api.host.updateStatus('guessing');

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
