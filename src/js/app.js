import { LitElement, html } from 'lit-element'
import { Lobby } from './lobby.js'
import { Game } from './game.js'
import { Loading } from './loading.js'
import { api } from './api.js'
const { Player } = require('./player.js');

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
    
    this.state = 'loading';
    this.stateAfterLoading = 'game'; //debug only
    this.api = api; //debug only
    this.players = [];
    this.apiSetup();
    this.host;

    this.clicker = false;
    this.click = () => { this.clicker = !this.clicker }
    this.loader = setInterval(() => {
      if (this.host === undefined) return;
      this.state = this.stateAfterLoading;
      clearInterval(this.loader);
    }, 100);
  }

  render() {
    switch (this.state) {
      case 'loading': return html`
        <im-loading></im-loading>
      `;
      case 'lobby': return html`
        <im-lobby .clicker=${this.clicker}
        .api=${this.updateHostStatus} 
        .next=${()=>this.state='game'}
        ></im-lobby> 
      `;
      case 'game': return html`
        <im-game .players=${this.players} .clicker=${this.clicker}
          .host=${this.host} .api=${this.apiRef}>
        </im-game>
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
      let playerInd = this.players.findIndex(player => player.id === data);
      let lastInd = this.players.length - 1;
      this.players[playerInd] = this.players[lastInd];
      this.players.pop();
      this.click();
    });

    api.on('baseUpdate', (data) => { 
      this.players = data.map(player => Player.fromJSON(player));
      api.players = this.players;
      this.findHost();
      api.host = this.host;
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
