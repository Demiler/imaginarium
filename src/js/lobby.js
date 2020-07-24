import { LitElement, html } from 'lit-element'
import '../css/lobby-style.css'

const imgPath = '../../img';
const avPath = '../../img/avatars';

class Lobby extends LitElement {
  static get properties() {
    return {
      players: { type: Array },
    }
  }

  constructor() {
    super();
    this.players = [];
    this.updateMe = false;
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

      </div>
    `;
  }

  createRenderRoot() { return this }
}

customElements.define('im-lobby', Lobby); 
