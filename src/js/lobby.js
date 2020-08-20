import { LitElement, html } from 'lit-element'
import '../css/lobby-style.css';
import './im-navbar.js';
import { api } from './api';

//const avPath = '../../img/avatars';

class Lobby extends LitElement {
  static get properties() {
    return {
      clicker: { type: Boolean },
    }
  }

  constructor() {
    super();
    this.rgx = /^#[1-9a-fA-F]{3,6}$/;
    api.on('colorUpdate', (data) => {
      if (typeof data.color !== "string") return;
      if (!this.rgx.test(data.color)) return;
      api.players.find(pl => pl.id === data.id).color = data.color;
      this.requestUpdate()
    });
  }

  render() {
    return html`
      <div class="lobby-container">
        <im-navbar></im-navbar>
        <h1>Player List</h1>

        <div class="player-list">
          ${api.players.map(player => html`
            <div class="player ${player.status}">
              <img class="player-image" style="background-color: ${player.avatar.color}" 
              src="${player.avatar.img}">
              <span class="player-name">${player.name}</span>
            </div>
          `)}
        </div>

        <div class="player-counter">
          <span class="ready">
            ${api.players.filter(player => player.status === "ready").length}
          </span>/<span class="total">
            ${api.players.length}
          </span>
        </div>

        <button class="ready-button ${api.host.status}" @click=${this.readyButton}>
          ${api.host.status === 'ready' ? 'not ready' : 'ready'}
        </button>

      </div>
    `;
  }

  readyButton() {
    api.host.status = api.host.status === 'ready' ? 'not-ready' : 'ready';
    api.sendServer('lobbyUpdate', api.host.status);
    this.requestUpdate();
  }

  createRenderRoot() { return this }
}

customElements.define('im-lobby', Lobby); 
