import { LitElement, css, html } from 'lit-element'
import './im-input2.js'
import './im-slider.js'
import './im-fold-button.js'
import { isValidKey } from './utils/isValidKey.js'
import * as icons from './icons.js'

class CreateGame extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        width: 400px;
        height: 400px;
        background-color: #333344;
        padding: 10px;
        border-radius: 10px;
      }

      title {
        font-size: 20px;
        display: inline-block;
        text-align: center;
        background-color: inherit;
        margin-left: auto;
        margin-right: auto;
        padding: 5px;
        margin-top: -20px;
        border-radius: 10px;
      }

      .game-title {
        --background-focus: transparent;
        --font-size: 20px;
        --font-size-small: 14px;
        --underline-color-active: #575799;
        margin: 5px;
      }

      .btn {
        border: none;
        padding: 5px;
        background-color: #42425d;
        color: #eee;
        font-size: 15px;
        border-radius: 5px;
        font-family: "Hack";
        height: 30px;
        outline: none;
        transition: .2s;
      }

      .btn.focus-visible,
      .btn:hover {
        background-color: #46467c;
      }

      .btn.active {
        background-color: #4f4f98;
      }

      .setting {
        display: block;
        margin-top: 15px;
      }

      .setting .title {
        position: relative;
        width: 100%;
        font-size: 14px;
        margin-bottom: 5px;
        color: #777;
        margin-left: 5px;
      }

      .setting .input-group {
        display: flex;
        height: 30px;
      }
      
      .setting .input-group > * {
        height: auto;
        flex: 1 1 0;
      }
      
      .setting .btn-score {
        margin-right: 10px;
        --background: #42425d;
        --background-active: #4f4f98;
        --separator: #343457;
      }

      .setting .btn-cards {
        margin-left: 10px;
      }

      .setting .btn-friends {
        margin: 0 20px;
      }

      .players-count {
        display: flex;
        align-items: center;
        height: 30px;
      }

      .slider {
        width: 100%;
        height: 100%;
        --track-color: #515180;
        --track-color-focus: #555599;
        --thumb-width: 20px;
        --thumb-color: #656578;
      }

      .count {
        width: 20px;
        text-align: end;
        padding: 0 10px;
      }

      .link-field {
        background-color: #262634;
        padding: 5px 10px;
        border-radius: 5px;
        user-select: none;
        position: relative;
        outline: 0;
      }

      .link-field.focus-visible:after,
      .link-field:hover:after {
        content: 'Copy';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        background-color: #000000a0;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .copied-popup {
        position: absolute;
        padding: 8px;
        border-radius: 5px;
        background-color: #000000a0;
        top: 0;
        width: 80px;
        text-align: center;
        left: calc(50% - 40px);
        opacity: 0;
        transition: .2s;
      }

      .btn-create {
        width: 150px;
        height: 40px;
        font-size: 20px;
        text-transform: uppercase;
        margin-top: auto;
        align-self: center;
      }
    `;
  }

  render() {
    return html`
      <title>Create game</title>

      <im-input2 class='setting game-title'
        .placeholder=${'title'}
        @input=${({currentTarget}) => this.title = currentTarget.value.trim()}
      ></im-input2>

      <div class='setting play-style'>
        <div class='title'>Play until</div>
        <div class='input-group' @click=${this.playStyleChange}>
          <im-foldbutton class='btn-score'
           @valueChange=${({target}) => this.maxScore = target.value }
          >max score</im-foldbutton>
          <button class='btn btn-cards'>cards run out</button>
        </div>
      </div>

      <div class='setting connection-type'>
        <div class='title'>Connection type</div>
        <div class='input-group' @click=${this.connectionTypeChange}>
          <button class='btn btn-open'>open</button>
          <button class='btn btn-friends'>friends only</button>
          <button class='btn btn-private'>private</button>
        </div>
      </div>

      <div class='setting connection-type'>
        <div class='title'>Maximum players</div>
        <div class='players-count'>
          <im-slider .min=${3} .max=${8} class='slider' .wheelStep=${1}
          @valueChange=${({currentTarget}) => this.maxPlayers = currentTarget.value}
          ></im-slider>
          <span class='count'>${this.maxPlayers}</span>
        </div>
      </div>

      <div class='setting link'>
        <div class='title'>Link</div>
        <div class='link-field' tabIndex=0 
         @keydown=${this.copyLink}
         @click=${this.copyLink}
        >
         <span class='text'>${this.link}</span>
         <span class='copied-popup'>copied</span>
       </div>
      </div>

      <button class='btn btn-create'
      @click=${this.createGame}
      >create</button>
    `;
  }

  createGame(event) {
    const gameData = {
      title: this.title,
      playStyle: this.playStyle,
      maxScore: this.maxScore,
      connectionType: this.connectionType,
      maxPlayers: this.maxPlayers,
      link: this.link
    }
    //api.sendServer('create-game', gameData);
    console.log('request send!');
  }

  copyLink(event) {
    if (event.type === 'keydown' && !isValidKey(event.key)) return;

    this.linkPopup.style="opacity: 1; top: 30px;" 
    setTimeout(() => this.linkPopup.style="", 500);
    navigator.clipboard.writeText(this.link);
  }

  playStyleChange(event) {
    if (event.currentTarget === event.target) return;
    if (event.target === this.choosenPlayStyle) return;
    this.choosenPlayStyle.tabIndex = 0;

    if (this.choosenPlayStyle.disactivate)
      this.choosenPlayStyle.disactivate();
    else
      this.choosenPlayStyle.classList.remove('active');

    this.choosenPlayStyle = event.target;
    if (this.choosenPlayStyle.activate)
      this.choosenPlayStyle.activate();
    else
      this.choosenPlayStyle.classList.add('active');

    this.choosenPlayStyle.tabIndex = -1;
    this.playStyle = this.choosenPlayStyle.innerText;
  }

  connectionTypeChange(event) {
    if (event.currentTarget === event.target) return;
    if (event.target === this.choosenConnection) return;
    this.choosenConnection.tabIndex = 0;
    this.choosenConnection.classList.remove('active');
    this.choosenConnection = event.target;
    this.choosenConnection.classList.add('active');
    this.choosenConnection.tabIndex = -1;
    this.connectionType = this.choosenConnection.innerText;
  }

  firstUpdated() {
    this.choosenPlayStyle = this.shadowRoot.querySelector('.btn-score');
    this.choosenConnection = this.shadowRoot.querySelector('.btn-open');
    this.linkPopup = this.shadowRoot.querySelector('.copied-popup');

    this.connectionType = this.choosenConnection.innerText;
    this.playStyle = this.choosenPlayStyle.innerText;

    setTimeout(() => this.choosenPlayStyle.activate(false), 1);
    this.choosenConnection.classList.add('active');

    this.choosenConnection.tabIndex = -1;
    this.choosenPlayStyle.tabIndex = -1;
    window.applyFocusVisiblePolyfill(this.shadowRoot);
  }

  constructor() {
    super();
    this.maxPlayers = 3;
    this.maxScore = 50;
    this.link = 'imgn.com/game?id=23j1oi23j';
  }

  static get properties() {
    return {
      maxPlayers: { type: Number },
    }
  }
}

customElements.define('im-create', CreateGame);
