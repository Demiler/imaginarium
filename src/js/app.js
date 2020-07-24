import { LitElement, html } from 'lit-element'
import { Lobby } from './lobby.js'
import { Api } from './api.js'
import { Player } from './player'

const api = new Api();

class ImApp extends LitElement {
  static get properties() {
    return {
      state: { type: String },
      players: { type: Array },
      clicker: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.state = 'lobby';
    this.apiRef = api;
    this.apiSetup();
    this.players = [];
    this.host;

    this.clicker = false;
    this.click = () => { this.clicker = !this.clicker }
    this.clickerInteraval = setInterval(() => {
      this.click();
    }, 5000000);
  }

  render() {
    switch (this.state) {
      case 'lobby': return html`
        <im-lobby .players=${this.players} .clicker=${this.clicker}
          .host=${this.host} .api=${api}></im-lobby> 
      `;
      default: return html`not found`;
    }
  }

  apiSetup() {
    api.on('newMessage', (msg) => {
      console.log(`message from ${msg.id}: ${msg.data}`);
    });

    api.on('yourId', (data) => this.hostId = data);

    api.on('newClient', (data) => {
      this.players.push(new Player(
        data.id, data.name, "0.png", "not-ready", 0
      ));
      this.click();
    });

    api.on('removeClient', (data) => {
      this.players = this.players.filter(player => player.id !== data);
      this.host = this.players.find(player => player.id === this.hostId);
    });

    api.on('baseUpdate', (data) => { 
      this.players = data.map(
        el => new Player(el.id, el.name, "0.png", "not-ready", 0)
      );
      this.host = this.players.find(player => player.id === this.hostId);
    });

    api.on('statusUpdate', (data) => {
      let player = this.players.find(player => player.id === data.id);
      player.status = data.status;
      this.click();
    });
  }

  createRenderRoot() { return this }
}

customElements.define('im-app', ImApp); 
