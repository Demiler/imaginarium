import { LitElement, css, html } from 'lit-element'
import './im-navbar.js';
import './create-game.js';
import * as icons from './icons'
const { Player } = require('./player.js');

class GamePreview extends LitElement {
  static get styles() {
    return css`
      :host {
        height: 100px;
        /*width: 400px;*/
        display: block;
        background-color: #333344;
        margin-left: auto;
        margin-right: auto;
        border-radius: 10px;
        padding: 10px;

        display: grid;
        grid-template-areas: 
          "title _join"
          "_plrs count";
      }

      .title {
        font-size: 20px;
        grid-area: title;
      }

      .status {
        font-size: 10px;
        color: #aaa;
        display: block;
        margin-top: 5px;
      }

      .btn-join {
        grid-area: _join;
        margin-left: auto;
      }

      .player-counter {
        grid-area: count;
        margin-top: auto;
        margin-left: auto;
        padding: 5px;
        background-color: #222233;
        border-radius: 5px;
        color: #ccc;
        width: 60px;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
      }
      
      .player-list {
        grid-area: _plrs;
        display: flex;
        flex-direction: row;
        margin-top: auto;
        width: 100%;
        height: 30px;
        align-items: center;
        position: relative;
      }

      .player {
        z-index: 1;
        margin-left: 5px;
      }

      .player:first-child {
        margin-left: 0;
      }

      .player,
      .player-image {
        width: 30px;
        height: 30px;
        border-radius: 50%;
      }

      .btn-join {
        border: none;
        background-color: #454566;
        color: #eee;
        text-transform: uppercase;
        border-radius: 5px;
        width: 100px;
        height: 30px;
        font-size: 15px;
        transition: .2s;
        outline: none;
      }

      .btn-join.focus-visible,
      .btn-join:hover {
        filter: brightness(1.2);
      }

      :host([unavailable]) button { display: none }
    `;
  }

  static get properties() {
    return {
      available: { type: Boolean },
    }
  }

  firstUpdated() {
    const leftSpace = this.players.length < this.maxPlayers;
    const stillWaiting = this.status === 'Awaiting players';
    const attr = leftSpace && stillWaiting ? 'available' : 'unavailable';
    this.available = leftSpace && stillWaiting;
    this.setAttribute(attr, '');
  }

  render() {
    return html`
      <span class='title'>
        ${this.title}
        <span class='status'>${this.status}</span>
      </span>
      <div class='player-list' style="width: ${this.maxPlayers * 35 - 5}px">
        ${this.players.map(player => html`
          <span class='player'>
            <img class='player-image' src="${player.avatar.img}"
             style="background-color: ${player.avatar.color}">
          </span>
        `)}
      </div>
      <button class='btn btn-join'>Join</button>
      <div class='player-counter'>
        <span class='players-now'>${this.players.length}</span>
        <span class='d'>/</span>
        <span class='players-max'>${this.maxPlayers}</span>
      </div>
    `;
  }
}

class Selector extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }

      .center {
        margin-top: 20px;
        width: 420px;
        margin-left: auto;
        margin-right: auto;
        display: flex;
        flex-direction: column;
      }
      
      .game:not(:last-child) {
        margin-bottom: 40px;
      }

      .game[unavailable] {
        filter: brightness(.9) grayscale(1);
      }

      .input-group {
        display: flex;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 20px;
        width: 100%;
        align-items: center;
        justify-content: space-between;
      }

      .btn {
        border: none;
        outline: none;
        font-size: 15px;
        text-transform: uppercase;
        border-radius: 5px;
        height: 40px;
        width: 150px;
        background-color: #343444;
        color: #eee;
        cursor: pointer;
        padding-left: 32px;
      }

      .btn.focus-visible,
      .btn:hover {
        filter: brightness(1.2);
      }

      .btn-wrap {
        position: relative;
      }

      .btn-image {
        position: absolute;
        top: calc(50% - 10px);
        left: 8px;
        z-index: 1;
      }

      .btn-image svg {
        width: 20px;
        height: 20px;
      }

      .btn-quick {
        background-color: #267634;
      }

      .btn-create {
        background-color: #195a93;
      }

      .create-game {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000000a0;
        z-index: 5;
        display: none;
        align-items: center;
        justify-content: center;
      }

      .create-game.show {
        display: flex;;
      }

    `;
  }

  constructor() {
    super();
    this.games = gamesDebug;
  }

  firstUpdated() {
    this.gameCreator = this.shadowRoot.querySelector('.create-game');
  }

  render() {
    return html`
      <im-navbar></im-navbar>
      <div class='center'>
        <div class='input-group'>
          <div class='btn-wrap'>
            <span class='btn-image'>${icons.lightning}</span>
            <button class='btn btn-quick'> Quick game</button>
          </div>
          <div class='btn-wrap'>
            <span class='btn-image'>${icons.plus}</span>
            <button class='btn btn-create'
            @click=${this.createGame}
            > Create game</button>
          </div>
        </div>
        <div class='games-container'>
          ${this.games.map(game => html`
            <im-gameprev class='game'
               .title=${game.title}
               .status=${game.status}
               .players=${game.players}
               .maxPlayers=${game.maxPlayers}
            ></im-gameprev>
          `)}
          
          <div class='create-game' @click=${this.closeCreator}>
            <im-create ></im-create>
          </div>
        </div>
      </div>
    `;
  }

  closeCreator(event) {
    if (event.target === event.currentTarget)
      this.gameCreator.classList.remove('show');
  }

  createGame() {
    this.gameCreator.classList.add('show');
  }
}

customElements.define('im-selector', Selector);
customElements.define('im-gameprev', GamePreview);

let gamesDebug = [
  {
    title: 'Game number one',
    status: 'Awaiting players',
    players: [
      new Player(0, 'Dude one'),
      new Player(1, 'Dude two'),
    ],
    maxPlayers: 6,
  },
  {
    title: 'Hello there dude',
    status: 'Awaiting players',
    players: [
      new Player(3, 'Dude three'),
      new Player(4, 'Dude four'),
      new Player(5, 'Dude five'),
      new Player(6, 'Dude six'),
      new Player(7, 'Dude seven'),
    ],
    maxPlayers: 8,
  },
  {
    title: 'Minimum players here',
    status: 'In progress',
    players: [
      new Player(8, 'Dude eight'),
      new Player(9, 'Dude nine'),
      new Player(10, 'Dude ten'),
    ],
    maxPlayers: 3,
  },
  {
    title: 'I\'m alone here',
    status: 'Awaiting players',
    players: [
      new Player(11, 'Dude eleven'),
    ],
    maxPlayers: 5,
  },
];
