import { LitElement, html } from 'lit-element'
import { Lobby } from './lobby.js'
import { Api } from './api.js'
//import { Player } from './player'
const { Player } = require('./player.js');

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
          .host=${this.host} .api=${this.updateHostStatus}></im-lobby> 
      `;
      default: return html`not found`;
    }
  }

  updateHostStatus() {
    if (this.host.status !== 'ready' && this.host.status !== 'not-ready') {
      this.host.status = 'not-ready';
      this.requestUpdate();
    }
    api.sendServer(`statusUpdate ${this.host.status}`);
  }

  findHost() {
    this.host = this.players.find(player => player.id === this.hostId);
  }
  apiSetup() {
    api.on('newMessage', (msg) => {
      console.log(`message from ${msg.id}: ${msg.data}`);
    });

    api.on('yourId', (data) => this.hostId = data);

    api.on('newClient', (data) => {
      this.players.push(Player.fromJSON(data));
      this.click();
    });

    api.on('removeClient', (data) => {
      this.players = this.players.filter(player => player.id !== data);
      this.findHost();
    });

    api.on('baseUpdate', (data) => { 
      this.players = data.map(player => Player.fromJSON(player));
      this.findHost();
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
