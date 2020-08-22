import { LitElement, html } from 'lit-element'
import './lobby.js'
import './game.js'
import './loading.js'
import './login.js'
import './selector.js'
import './create-game.js'
import { api } from './api.js'
import * as icons from './icons'

class ImApp extends LitElement {
  static get properties() {
    return {
      state: { type: String },
      clicker: { type: Boolean },
    };
  }

  constructor() {
    super();
    //console.clear();
    
    this.state = 'loading';
    this.everyonesCards = api.cards;
    this.stateAfterLoading = 'lobby'; //debug only
    this.api = api; //debug only
    this.apiSetup();

    this.clicker = false;
    this.click = () => { this.clicker = !this.clicker }
  }

  render() {
    switch (this.state) {
      case 'selector': return html`
        <im-selector></im-selector>


      `;
      case 'login': return html`
        <im-login></im-login>
      `;
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
    api.on('login', () => {
      this.state = 'login';
    });

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

    api.subscribe('game', () => {
      this.state = 'game';
    });
  }

  createRenderRoot() { return this }
}

customElements.define('im-app', ImApp); 
