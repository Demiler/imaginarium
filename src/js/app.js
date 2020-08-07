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
    this.stateAfterLoading = 'lobby'; //debug only
    this.api = api; //debug only
    this.players = [];
    this.apiSetup();
    this.hostId = localStorage.getItem('myId');

    this.clicker = false;
    this.click = () => { this.clicker = !this.clicker }
    this.loader = setInterval(() => {
      if (this.host === undefined) return;
      this.state = this.stateAfterLoading;
      clearInterval(this.loader);
    }, 600);
  }

  render() {
    switch (this.state) {
      case 'loading': return html`
        <im-loading></im-loading>
      `;
      case 'lobby': return html`
        <im-lobby .clicker=${this.clicker}
        .next=${()=>this.state='game'}
        ></im-lobby> 
      `;
      case 'game': return html`
        <im-game .clicker=${this.clicker}></im-game>
      `;

      case 'close tab': return html`
        <style>
          #closeTab {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #wrap {
            text-align: center;
            font-size: 40px;
          }
        </style>
        <div id="closeTab"><span id="wrap">
            You can use only one tab at a time. Please close this one.
        </span><div>
      `;
      default: return html`not found`;
    }
  }

  findHost() {
    this.host = this.players.find(player => player.id === this.hostId);
    api.host = this.host;
  }

  apiSetup() {
    api.on('newMessage', (msg) => {
      console.log(`message from ${msg.id}: ${msg.data}`);
    });

    api.on('yourId', (data) => { 
      this.hostId = data;
      localStorage.setItem('myId', this.hostId);
    });

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
    });

    api.on('statusUpdate', (data) => {
      let player = this.players.find(player => player.id === data.id);
      player.status = data.status;
      this.click();
    });

    api.on('close this tab', () => {
      clearInterval(this.loader);
      this.state = 'close tab';
    });
  }

  createRenderRoot() { return this }
}

customElements.define('im-app', ImApp); 
