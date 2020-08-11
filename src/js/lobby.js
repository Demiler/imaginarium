import { LitElement, html } from 'lit-element'
import '../css/lobby-style.css'
import { api } from './api';

const avPath = '../../img/avatars';

class Lobby extends LitElement {
  static get properties() {
    return {
      clicker: { type: Boolean },
    }
  }

  constructor() {
    super();
    api.on('colorUpdate', (data) => {
      api.players.find(pl => pl.id === data.id).color = data.color;
      this.requestUpdate()
    });
  }

  render() {
    return html`
      <header>
        <span class="name-tag">Imaginarium</span>
        <div class="player">
          <img class="player-image" style="background-color: ${api.host.color}" 
            src="${avPath}/${api.host.icon}" @click=${() => api.sendServer('IWantNewColor')}>
          <span class="player-name">${api.host.name}</span>
        </div>
      </header>
      <div class="lobby-container">

        <h1>Player List</h1>

        <div class="player-list">
          ${api.players.map(player => html`
            <div class="player ${player.status}">
              <img class="player-image" style="background-color: ${player.color}" src="${avPath}/${player.icon}">
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
