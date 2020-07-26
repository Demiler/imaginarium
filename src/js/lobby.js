import { LitElement, html } from 'lit-element'
import '../css/lobby-style.css'
import * as icons from './icons.js'

const imgPath = '../../img';
const avPath = '../../img/avatars';

class Lobby extends LitElement {
  static get properties() {
    return {
      players: { type: Array },
      clicker: { type: Boolean },
      host: { type: Object },
      api: { type: Object }
    }
  }

  constructor() {
    super();
    this.players = [];
    this.updateMe = false;
    this.iii = icons;
  }

  render() {
    return html`
      <div class="lobby-container">
        <header>
          <span class="name-tag">Imaginarium</span>
        </header>

        <h1>Player List</h1>

        <div class="player-list">
          ${this.players.map(player => html`
            <div class="player ${player.status}">
              <img class="player-image" src="${avPath}/${player.icon}">
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

  readyButton() {
    this.host.status = this.host.status === 'ready' ? 'not-ready' : 'ready';
    this.api();
    this.requestUpdate();
  }

  createRenderRoot() { return this }
}

customElements.define('im-lobby', Lobby); 
