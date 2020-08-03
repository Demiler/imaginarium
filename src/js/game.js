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
    this.leaderId = -1;
    this.host = api.host;
    this.host.cards = getRandomCards();

    this.host.updateStatus = (newStatus) => {
      this.host.status = newStatus;
      api.sendServer(`statusUpdate ${newStatus}`);      
      this.click();
    };

    this.initNewTurn();

    this.click = () => { this.clicker = !this.clicker }

    api.on('gameUpdate', (data) => {
      this.state = data
      this.initOnState();
    });

    api.on('statusUpdate', (data) => this.onStateCheck(data));

    api.on('choosedCards', (data) => {
      this.everyonesCards = data;
    });

    api.on('removePlayer', (id) => {
      if (id === this.leader.id) {
        const waitPls = setInterval(() => {
          let findLeader = this.players.find(pl => pl.id === this.leader.id);
          if (findLeader !== undefined) {
            this.leader = findLeader;
            clearInterval(waitPls);
          }
        }, 500);
      }
    });

    api.on('leaderGuess', (guess) => this.leader.guess = guess);
  }

  render() {
    switch (this.state) {
      case 'leader guessing': return this.drawLeaderGuessing();
      case 'waiting for leader': return this.drawWaitingForLeader();
      case 'guessing leader card': return this.drawGuessingLeaderCard();
      case 'picking own card': return this.drawPickingOwnCard();
      case 'waiting for others': return this.drawWaitingForOthers();
      case 'turn results': return this.drawTurnResults();
      default: return html`not found: ${this.state}`;
    }
  }

  onStateCheck(data) {
    this.click();
    switch (this.state) {
      case 'waiting for others': this.ifEveryoneChooseACard(); break;
      case 'guessing leader card': this.ifEveryoneGuessedACard(); break;
    }
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

  initNewTurn() {
    this.everyonesCards = [];
    this.leaderId = ++this.leaderId;
    if (this.leaderId >= this.players.length) 
      this.leaderId = 0;
    this.leader = this.players[this.leaderId];
    this.leader.guess = '';
    this.state = this.leader === this.host ? 'leader guessing' : 'waiting for leader';
    //this.host.cards.push(getNewCard());
    this.initOnState();
  }

  initLeaderGuessing() {
    this.updateGoBtn();
    this.host.updateStatus('guessing');
  }

  initWaitingForLeader() {
    this.host.updateStatus('waiting');
  }

  initPickingOwnCard() {
    this.updatePickBtn();
    this.host.updateStatus('picking');
  }

  initWaitingForOthers() {
    this.host.updateStatus('waiting');
    let card = this.host.choosenCard.currentSrc.split('/').pop();
    api.sendServer(`choosedCard ${card}`);      
    this.ifEveryoneChooseACard();
  }

  initGuessingLeaderCard() {
    if (this.host.id === this.leader.id)
      this.host.updateStatus('watching');
    else
      this.host.updateStatus('thinking');
    this.host.choosenCard = undefined;
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
      this.initNewTurn()
    }, 1000);
    }, 1000);
    }, 1000);
    }, 1000);
    }, 1000);
    }, 1000);
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
      api.send('gameUpdate', 'picking own card');
      api.send('leaderGuess', this.leader.guess);
      await sleep(1500);
      this.state = 'waiting for others';
      this.initOnState();
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

  ifEveryoneGuessedACard() {
    //if (this.players.every(pl => pl.status === 'waiting')) {
      //this.state = 'turn results';
      //api.sendServer('getChoosedCards');
      //this.initOnState();
    //}
  }

  async ifEveryoneChooseACard() {
    if (this.players.every(pl => pl.status === 'waiting')) {
      api.sendServer('getChoosedCardsNoID');
      while (this.everyonesCards.length = 0) 
        await sleep(100);
      await sleep(1000);
      this.state = 'guessing leader card';
      this.initOnState();
    }
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
                <img class="card-image" src="../img/cards/${choose.card}">
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

      //${this.host === this.leader ? html`` : html`
        //<button class='btn-0 pick-btn ${this.pickBtn === 'go' ? 'ready' : 'not-ready'}'
          //@click=${this.pickBtnGo}>
          //${this.pickBtn}
        //</button>
      //`}

  drawGuessingLeaderCard() {
    return html`
      ${this.leader.id !== this.host.id ? html
      `<im-popup .time=${2500} .text=${"Guess what leader thought"}></im-popup>`
      : html``}
      <div class='game-container'>
        ${this.drawSidebar()}
        ${this.drawLeader()}        
        ${this.drawCards((event) => {
          if (this.host === this.leader) return;
          this.chooseCard(event);
          if (this.host.choosenCard === undefined) {
            this.host.updateStatus('thinking');
            api.sendServer('removeCard');
          }
          else {
            this.host.updateStatus('waiting');
            this.ifEveryoneGuessedACard();
            let card = this.host.choosenCard.currentSrc.split('/').pop();
            api.sendServer(`guessedCard ${card}`);
          }
          api.sendServer(`statusUpdate ${this.host.status}`);

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
          ${this.players.filter(player => player.id !== this.leader.id).map(
          player => html`
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

  drawCards(clickAction = ()=>{}, cards = this.host.cards) {
    return html`
      <div class="cards-container">
        ${cards.map(card => html`
          <div class="card preview" @click="${clickAction}">
            <div class="wrap">
              <img class="card-image" src="${cardsPath}/${card}">
            </div>
          </div>
        `)}
      </div>
    `;
  }

  createRenderRoot() { return this }
}

customElements.define('im-game', Game); 
