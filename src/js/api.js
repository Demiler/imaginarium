export class Api {
  constructor() {
    this.handlers = new Map()
    this.tries = 0;

    this.on = (type, handler) => {
      if (!this.handlers.has(type)) this.handlers.set(type, [])
      this.handlers.get(type).push(handler)
    }

    this.send = (type, data) =>
      this.ws.send(JSON.stringify({ type, data }));

    this.sendServer = (msg) => this.ws.send(`server ${msg}`);

    this.conect();
  }

  conect() {
    this.ws = new WebSocket(`ws://192.168.1.67:8081/`);

    this.ws.onopen = (event) => {
      console.log('WebSocket is open now');
      this.tries = 0;
      clearInterval(this.reconnect);
      this.sendServer('clientId ' + localStorage.getItem('myId'));
    }

    this.ws.onclose = (event) => {
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

    this.ws.onerror = (event) => {
      console.log('Some sort of error in WebSocket');
      clearInterval(this.reconnect);
    }

    this.ws.onmessage = (event) => {
      if (event.data === '__ping__') {
        //console.log('ping from server');
        return this.ws.send('__pong__');
      }

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

api.on('cards', (data) => {
  api.hostCards = data;
});
