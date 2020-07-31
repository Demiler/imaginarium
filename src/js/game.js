import { LitElement, html } from 'lit-element'
import { Popup } from './popup.js'
import { api } from './api.js'
import { sleep } from './utils/sleep.js'
import '../css/game-style.css'

const cardsPath = '../../img/cards';
const getRandomCards = () => {
  return ['card0.jpeg', 'card1.jpeg', 'card2.jpeg', 'card3.jpeg', 'card4.jpeg'];
}

class Game extends LitElement {
  static get properties() {
    return {
      players: { type: Array },
      clicker: { type: Boolean },
      host: { type: Object },
      next: { type: Object },
      state: { type: String },
      goBtn: { type: String },
      pickBtn: { type: String }, 
      hideElm: { type: String },
    }
  }

  constructor() {
    super();
    this.players = api.players;
    this.host = api.host;
    this.leader = this.players[0];
    this.leader.guess = '123';
    this.state = this.leader === this.host ? 'leader guessing' : 'waiting for leader';
    this.host.cards = getRandomCards();
    this.initOnState();

    api.on('gameUpdate', (data) => {
      this.state = data
      this.initOnState();
    });
  }

  render() {
    switch (this.state) {
      case 'leader guessing': return this.drawLeaderGuessing();
      case 'waiting for leader': return this.drawWaitingForLeader();
      case 'player guessing': return this.drawPlayerGuessing();
      case 'picking own card': return this.drawPickingOwnCard();
      case 'waiting for others': return this.drawWaitingForOthers();
      default: return html`not found ${this.state}`;
    }
  }

  initOnState() {
    switch (this.state) {
      case 'picking own card': this.initPickingOwnCard(); break;
      case 'waiting for leader': this.initWaitingForLeader(); break;
      case 'leader guessing': this.initLeaderGuessing(); break;
      case 'waiting for others': this.initWaitingForOthers(); break;
    }
  }

  initPickingOwnCard() {
    this.updatePickBtn();
    this.players.forEach(pl => pl.status = 'picking');
    this.leader.status = 'waiting';
  }

  initWaitingForLeader() {
    this.players.forEach(pl => pl.status = 'waiting');
    this.leader.status = 'guessing';
  }

  initLeaderGuessing() {
    this.updateGoBtn();
    this.players.forEach(pl => pl.status = 'waiting');
    this.leader.status = 'guessing';
  }

  initWaitingForOthers() {
    this.host.status = 'waiting';
    api.sendServer(`statusUpdate ${this.host.status}`);
  }

  initAfterGuess() {
    this.state = 'waiting for others'
    this.players.forEach(pl => pl.status = 'picking');
    this.leader.status = 'waiting';
    api.send('gameUpdate', 'picking own card');
  }


  updateGoBtn() {
    let card = this.host.choosenCard !== undefined;
    let guess = this.host.guess !== '';
    if (card && guess) 
      this.goBtn = "go";
    else if (card) 
      this.goBtn = "guess";
    else if (guess)
      this.goBtn = "card";
    else
      this.goBtn = "guess & card";
  }

  setGuess() {
  }

  keyListener(event) {
    if (event.key === 'Enter') this.setGuess();
  }

  updateGuess(event) {
    this.leader.guess = event.target.value;
    this.updateGoBtn();
  }
  
  async goBtnGo(event) {
    if (this.goBtn === 'go') {
      event.currentTarget.classList.add('yep');
      await sleep(1500);
      this.initAfterGuess();
    }
  }

  chooseCard(event) {
    if (this.host.choosenCard !== undefined) {
      this.host.choosenCard.classList.remove("choosen");
    }
    if (this.host.choosenCard !== event.target) {
      this.host.choosenCard = event.target;
      event.target.classList.add("choosen");
    }
    else { 
      this.host.choosenCard = undefined;
    }
  }

  updatePickBtn() {
    if (this.host.choosenCard !== undefined)
      this.pickBtn = 'go';
    else
      this.pickBtn = 'pick a card';
  }
  
  async pickBtnGo(event) {
    if (this.pickBtn !== 'go') return;

    event.target.classList.add('yep');
    await sleep(1000);
    this.state = 'waiting for others';
    this.initOnState();
  }

  drawCards(clickAction = ()=>{}) {
    return html`
      <div class="cards-container">
        ${this.host.cards.map(card => html`
          <div class="card preview" @click="${clickAction}">
            <div class="wrap">
              <img class="card-image" src="${cardsPath}/${card}">
            </div>
          </div>
        `)}
      </div>
    `;
  }

  drawPickingOwnCard() {
    return html`
      <div class='game-container'>
        <im-popup .time=${2500} .text=${"Now pick your own card"}></im-popup>
        ${this.drawSidebar()}
        ${this.drawLeader()}        
        ${this.drawCards((event) => {
          this.chooseCard(event);
          this.updatePickBtn();
        })}

        <button class='btn btn-0 pick-btn ${this.pickBtn === 'go' ? 'ready' : 'not-ready'}'
          @click=${this.pickBtnGo}>
          ${this.pickBtn}
        </button>
      </div>
    `;
  }

  drawWaitingForOthers() {
    return html`
      <div class='game-container'>
        ${this.drawSidebar()}
        ${this.drawLeader()}        

        <div class="cards-container">
          ${this.players.map(player => html`
            <div class="card ${player.status}">
              <div class="wrap">
                <img class="card-image" src="../img/cardbacksmall.png">
              </div>
            </div>
          `)}
        </div>

      </div>
    `;
  }

  drawWaitingForLeader() {
    return html`
      <div class='game-container'>
        ${this.drawSidebar()}
        ${this.drawLeader()}        
        ${this.drawCards()}
      </div>
    `;
  }

  drawLeaderGuessing() {
    return html`
      <div class='game-container'>
        ${this.drawSidebar()}

        <div class="leader">
          <div class="leader-wrap">
            <img class="leader-image" src="../img/avatars/${this.leader.icon}">
            <span class="leader-name">${this.leader.name}</span>
            <span class="player-score">${this.leader.score}</span>
          </div>
          <div class="leader-control" @keyup="${this.keyListener}">
            <input class="guess-field" placeholder="Enter your guess"
              value="${this.leader.guess}" @change="${this.updateGuess}">
          </div>
          <hr class="leader-underline">
        </div>

        ${this.drawCards((event) => {
          this.chooseCard(event);
          this.updateGoBtn();
        })}

        <button class="btn btn-0 go-button ${this.goBtn !== 'go' ? 'not-ready' : 'ready'}"
          @click="${this.goBtnGo}">
          ${this.goBtn}
        </button>

      </div>
    `;
  }

  drawSidebar() {
    return html`
      <div class="sidebar">
        <div class="player-list">
          ${this.players.filter(player => player !== this.leader).map(player => html`
            <div class="player ${player.status}">
              <img class="player-image" style="background-color:${player.color}" src="../img/avatars/${player.icon}">
              <div class="playerSnN">
                <div class="player-name">${player.name}</div>
                <div class="player-status">${player.status.replace('-',' ')}</div>
              </div>
              <span class="player-score">${player.score}</span>
              <div class="player ${player.status}">
            </div>
          `)}
        </div>
    `;
  }

  drawLeader() {
    return html`
    <div class="leader">
      <div class="leader-wrap">
        <img class="leader-image" src="../img/avatars/${this.leader.icon}">
        <span class="leader-name">${this.leader.name}</span>
        <span class="player-score">${this.leader.score}</span>
      </div>
      <div class="leader-guess">${this.leader.guess}</div>
      <hr class="leader-underline">
    </div>
    `;
  }

  createRenderRoot() { return this }
}

customElements.define('im-game', Game); 
