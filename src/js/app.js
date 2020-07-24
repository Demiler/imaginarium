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
    };
  }

  constructor() {
    super();
    this.state = 'lobby';
    this.apiRef = api;
    this.apiSetup();
  }

  render() {
    switch (this.state) {
      case 'lobby': return html`
        <im-lobby .players=${this.players}></im-lobby>
      `;
      default: return html`not found`;
    }
  }

  apiSetup() {
    api.on('newMessage', (msg) => {
      console.log(`message from ${msg.id}: ${msg.data}`);
    });

    api.on('yourId', (data) => this.myId = data);

    api.on('newClient', (data) => {
      this.players.push(new Player(
        data.id, data.name, "0.png", "not-ready", 0
      ));
    });

    api.on('removeClient', (data) => {
      this.players = this.players.filter(player => player.id !== data);
    });

    api.on('baseUpdate', (data) => { 
      this.players = data.map(
        el => new Player(el.id, el.name, "0.png", "not-ready", 0)
      );
    });
  }

  createRenderRoot() { return this }
}

customElements.define('im-app', ImApp); 
