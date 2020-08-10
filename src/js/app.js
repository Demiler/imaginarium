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
      clicker: { type: Boolean },
    };
  }

  constructor() {
    super();
    
    this.state = 'loading';
    this.stateAfterLoading = 'lobby'; //debug only
    this.api = api; //debug only
    this.apiSetup();

    this.clicker = false;
    this.click = () => { this.clicker = !this.clicker }

    //this.loader = setInterval(() => {
      //if (this.host === undefined) return;
      //this.state = this.stateAfterLoading;
      //clearInterval(this.loader);
    //}, 600);

  }

  render() {
    switch (this.state) {
      case 'loading': return html`
        <im-loading></im-loading>
      `;
      case 'lobby': return html`
        <im-lobby .clicker=${this.clicker}></im-lobby> 
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

  apiSetup() {
    api.on('newMessage', (msg) => {
      console.log(`message from ${msg.id}: ${msg.data}`);
    });

    api.on('closeThisTab', () => {
      this.state = 'close tab';
    });

    api.on('appUpdate', (state) => {
      this.state = state;
    });

    api.subscribe('setup ready', (appState) => {
      this.state = appState;
      this.click();
    });

    api.subscribe('update', () => {
      this.click();
    });
  }

  createRenderRoot() { return this }
}

customElements.define('im-app', ImApp); 
