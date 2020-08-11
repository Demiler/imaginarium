import { LitElement, html } from 'lit-element'
import './popup.js'
import { api } from './api.js'
import { sleep } from './utils/sleep.js'
import '../css/game-style.css'

const cardsPath = '../../img/cards';

class Game extends LitElement {
  static get properties() {
    return {
      clicker: { type: Boolean },
      state: { type: String },
      goBtn: { type: String },
      pickBtn: { type: String }, 
    }
  }

  constructor() {
    super();

    //update status here or in api?
    //if (api.leader.id === api.host.id &&
        //api.leader.status === 'waiting-for-leader')
      //api.host.updateStatus('guessing');

    this.leader = api.leader;
    this.host = api.host; //debug only
    this.state = this.loadOnHostStatus();
    this.send = false;
    this.updatePickBtn();
    this.updateGoBtn();

    this.click = () => { this.clicker = !this.clicker }

    api.on('newTurn', (data) => this.initNewTurn(data));

    api.on('gameUpdate', (data) => {
      this.state = data
      this.initOnState();
    });

    api.on('statusUpdate', (data) => this.onStateCheck(data));

    api.on('choosedCards', (data) => {
      this.everyonesCards = data;
    });

    api.on('leaderGuess', (guess) => { 
      this.leader.guess = guess
      this.state = 'picking own card';
    });

    api.on('cardsUpdate', (data) => {
      console.log(data);
      let card = api.host.cards.findIndex(c => c === data.remove);
      if (card === undefined) return console.log('wtf card not found!');
      api.host.cards[card] = data.add;
      this.click();
    });

    api.on('guessLeaderCard', (cards) => {
      this.everyonesCards = cards;
      api.players.forEach(pl => pl.status = 'thinking');
      if (api.host.id === api.leader.id) 
        api.host.updateStatus('watching');
      this.state = 'guessing leader card';
      this.initOnState();
    });

    api.on('turnResults', (turnCards) => {
      this.everyonesCards = turnCards;
      this.state = 'turn results';
      this.initOnState();
    });
  }

  render() {
    switch (this.state) {
      case 'loading': return html`<im-loading></im-loading>`;
      case 'leader guessing': return this.drawLeaderGuessing();
      case 'waiting for leader': return this.drawWaitingForLeader();
      case 'picking own card': return this.drawPickingOwnCard();
      case 'guessing leader card': return this.drawGuessingLeaderCard();
      case 'waiting for others': return this.drawWaitingForOthers();
      case 'turn results': return this.drawTurnResults();
      default: return html`not found: ${this.state}`;
    }
  }

  loadOnHostStatus() {
    switch (api.host.status) {
      case 'waiting-for-leader':  return 'waiting for leader';
      case 'guessing':            return 'leader guessing';
      case 'picking':             return 'picking own card';
      case 'waiting-for-others':  return 'waiting for others';
      case 'cheking-results':     return 'turn results';
      default:                    return 'unknown';
    }
  }

  onStateCheck() {
    this.click();
  }

  initOnState() {
    switch (this.state) {
      case 'leader guessing'     : this.initLeaderGuessing(); break;
      case 'waiting for leader'  : this.initWaitingForLeader(); break;
      case 'picking own card'    : this.initPickingOwnCard(); break;
      case 'waiting for others'  : this.initWaitingForOthers(); break;
      case 'guessing leader card': this.initGuessingLeaderCard(); break;
      case 'turn results'        : this.initTurnResults(); break;
    }
  }

  initNewTurn(data) {
    this.leader = api.players[data.leader];
    this.everyonesCards = [];
    this.leader.guess = '';
    api.choosenCard = undefined;
    this.state = this.leader === api.host ? 'leader guessing' : 'waiting for leader';
    this.send = false;
    this.requestUpdate();
    this.initOnState();
  }

  initLeaderGuessing() {
    this.updateGoBtn();
    api.host.updateStatus('guessing');
  }

  initWaitingForLeader() {
  }

  initPickingOwnCard() {
    this.updatePickBtn();
  }

  initWaitingForOthers() {
    api.host.updateStatus('waiting-for-others');
    let card = api.host.choosenCard.currentSrc.split('/').pop();
    api.sendServer('choosenCard', card);      
  }

  initGuessingLeaderCard() {
    if (api.host.id === this.leader.id)
      api.host.updateStatus('watching');
    else
      api.host.updateStatus('thinking');
    api.host.choosenCard = undefined;
    this.updatePickBtn();
  }

  initTurnResults() {
    console.log('Next turn in: ');
    setTimeout(() => {
    console.log(5);
    setTimeout(() => {
    console.log(4);
    setTimeout(() => {
    console.log(3);
    setTimeout(() => {
    console.log(2);
    setTimeout(() => {
    console.log(1);
    setTimeout(() => {
      //this.initNewTurn()
    }, 1000);
    }, 1000);
    }, 1000);
    }, 1000);
    }, 1000);
    }, 1000);
  }

  updateGoBtn() {
    let card = api.host.choosenCard !== undefined;
    let guess = api.host.guess !== '';
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
    if (this.goBtn === 'go' && !this.send) {
      this.send = true;
      event.currentTarget.classList.add('yep');
      api.sendServer('leaderGuess', this.leader.guess);
      await sleep(1500);
      this.state = 'waiting for others';
      this.initOnState();
    }
  }

  chooseCard(event) {
    if (api.host.choosenCard !== undefined) {
      api.host.choosenCard.classList.remove("choosen");
    }
    if (api.host.choosenCard !== event.target) {
      api.host.choosenCard = event.target;
      event.target.classList.add("choosen");
    }
    else { 
      api.host.choosenCard = undefined;
    }
  }

  updatePickBtn() {
    if (api.host.choosenCard !== undefined)
      this.pickBtn = 'go';
    else
      this.pickBtn = 'pick a card';
  }
  
  async pickBtnGo(event) {
    if (this.pickBtn !== 'go' || this.send) return;

    this.send = true;
    event.target.classList.add('yep');
    await sleep(1000);
    this.state = 'waiting for others';
    this.initOnState();
  }

  drawTurnResults() {
    return html`
      <div class='game-container'>
        ${this.drawSidebar()}
        ${this.drawLeader()}        

        <div class='cards-container'>
          ${this.everyonesCards.map(choose => html`
            <div class="card preview ${
              choose.owner.id === this.leader.id ? "leader" : "common"}">
              <div class="wrap">
                <img class="card-image" src="../img/cards/${choose.card.path}">
                <img class="card-owner" src="../img/avatars/${choose.owner.icon}"
                     style="background-color: ${choose.owner.color}">
                <div class="picked-players">
                  ${choose.players.map(player => html`
                    <img class="picked-player" src="../img/avatars/${player.icon}"
                      style="background-color: ${player.color}">
                  `)}
              </div>
              </div>
            </div>
          `)}
        </div>

      </div>
    `;
  }

  drawGuessingLeaderCard() {
    return html`
      ${this.leader.id !== api.host.id ? html`
      <im-popup .time=${2500} .text=${"Guess what leader thought"}></im-popup>`
      : html``}
      <div class='game-container'>
        ${this.drawSidebar()}
        ${this.drawLeader()}        
        ${this.drawCards((event) => {
          if (api.host === this.leader) return;
          this.chooseCard(event);
          if (api.host.choosenCard === undefined) {
            api.host.updateStatus('thinking');
            api.sendServer('removeCard');
          }
          else {
            api.host.updateStatus('waiting');
            let card = api.host.choosenCard.currentSrc.split('/').pop();
            api.sendServer('guessedCard', card);
          }
          api.sendServer('statusUpdate', api.host.status);

          //this.updatePickBtn();
        }, this.everyonesCards)}
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
          ${api.players.map(player => html`
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
      <im-popup .time=${2500} .text=${"Pick a card a guess association to it"}></im-popup>
      <div class='game-container'>
        ${this.drawSidebar()}

        <div class="leader-container">
          <div class="leader-wrap">
            <img class="leader-image" src="../img/avatars/${this.leader.icon}"
              style="background-color: ${this.leader.color}">
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
          ${api.players.filter(player => player.id !== this.leader.id).map(
          player => html`
            <div class="player ${player.status}">
              <img class="player-image" 
                   style="background-color:${player.color}" 
                   src="../img/avatars/${player.icon}">
              <div class="playerSnN">
                <div class="player-name">${player.name}</div>
                <div class="player-status">${player.status.replace(/-/g,' ')}</div>
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
    <div class="leader-container">
      <div class="leader-wrap">
        <img class="leader-image" src="../img/avatars/${this.leader.icon}"
          style="background-color: ${this.leader.color}">
        <span class="leader-name">${this.leader.name}</span>
        <span class="player-score">${this.leader.score}</span>
      </div>
      ${this.leader.status === 'guessing' ? 
          html`<div class='leader-status ${this.leader.status}'>
            ${this.leader.status}</div>`
          :
          html`<div class="leader-guess ${this.leader.status}">
            ${this.leader.guess}</div>`
        }
      <hr class="leader-underline">
    </div>
    `;
  }

  drawCards(clickAction = ()=>{}, cards = api.host.cards) {
    return html`
      <div class="cards-container">
        ${cards.map(card => html`
          <div class="card preview" @click="${clickAction}">
            <div class="wrap">
              <img class="card-image" src="${cardsPath}/${card.path}">
            </div>
          </div>
        `)}
      </div>
    `;
  }

  createRenderRoot() { return this }
}

customElements.define('im-game', Game); 
