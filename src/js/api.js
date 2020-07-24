export class Api {
  constructor() {
    this.handlers = new Map()

    this.on = (type, handler) => {
      if (!this.handlers.has(type)) this.handlers.set(type, [])
      this.handlers.get(type).push(handler)
    }

    this.send = (type, data) =>
      this.ws.send(JSON.stringify({ type, data }));

    this.ws = new WebSocket('ws://localhost:8081/');

    this.ws.onopen = (event) => {
      console.log('WebSocket is open now');
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket is closed now');
    }

    this.ws.onerror = (event) => {
      console.log('Some sort of error in WebSocket');
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
