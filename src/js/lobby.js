import { LitElement, html } from 'lit-element'
import '../css/lobby-style.css'
import { api } from './api';

const imgPath = '../../img';
const avPath = '../../img/avatars';

class Lobby extends LitElement {
  static get properties() {
    return {
      players: { type: Array },
      clicker: { type: Boolean },
      host: { type: Object },
      api: { type: Function },
      next: { type: Object },
    }
  }

  constructor() {
    super();
    this.players = api.players;
    this.host = api.host;
    this.checker = setInterval(() => {
      this.ifAllReady();
    }, 3000);
  }

  render() {
    return html`
      <header>
        <span class="name-tag">Imaginarium</span>
        <div class="player">
          <img class="player-image" style="background-color: ${this.host.color}" src="${avPath}/${this.host.icon}">
          <span class="player-name">${this.host.name}</span>
        </div>
      </header>
      <div class="lobby-container">

        <h1>Player List</h1>

        <div class="player-list">
          ${this.players.map(player => html`
            <div class="player ${player.status}">
              <img class="player-image" style="background-color: ${player.color}" src="${avPath}/${player.icon}">
              <span class="player-name">${player.name}</span>
            </div>
          `)}
        </div>

        <div class="player-counter">
          <span class="ready">
            ${this.players.filter(player => player.status === "ready").length}
          </span>/<span class="total">
            ${this.players.length}
          </span>
        </div>

        <button class="ready-button ${this.host.status}" @click=${this.readyButton}>
          ${this.host.status === 'ready' ? 'not ready' : 'ready'}
        </button>

      </div>
    `;
  }

  ifAllReady() {
    if (this.players.every(player => player.status === 'ready')) {
      clearInterval(this.checker);
      this.next();
    }
  }

  readyButton() {
    this.host.status = this.host.status === 'ready' ? 'not-ready' : 'ready';
    this.api();
    this.ifAllReady();
    this.requestUpdate();
  }

  createRenderRoot() { return this }
}

customElements.define('im-lobby', Lobby); 
