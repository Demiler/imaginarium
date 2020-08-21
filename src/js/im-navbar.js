import { LitElement, html, css } from 'lit-element'
import './navbar.js';
import { api } from './api.js'
import * as icons from './icons.js'
import './css-transition.js'
import './user-menu.js'

class ImNavbar extends LitElement {
  static get styles() { return css`
      :host {
        display: block;
        height: 30px;
        background-color: #434353;
        padding: 0 1rem;
        user-select: none;
      }

      nav {
        display: flex;
        align-items: center;
        height: 100%;
      }

      .tag-name {
        margin-right: auto;
      }

      .volume-toggle {
        padding: 4px;
        background-color: #333344;
        border-radius: 50%;
        transition: filter .2s;
      }

      .volume-toggle.focus-visible,
      .volume-toggle:hover {
        filter: brightness(1.2);
      }

      .volume-toggle svg {
        display: flex;
        width: 18px;
        height: 18px;
      }

      .icon svg {
        width: 20px;
        height: 20px;
      }

      .separator {
        width: 2px;
        height: 70%;
        background-color: #373745eb;
        border-radius: 5px;
        margin-left: 10px;
      }

      .user {
        display: flex;
        margin-left: 10px;
        cursor: pointer;
        user-select: none;
      }

      .user-img {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-left: 10px;
      }

      .user-menu {
        position: absolute;
        background-color: #333344;
        right: 5px;
        top: 35px;
        width: 200px;
        display: flex;
        flex-direction: column;
        padding: 8px;
        z-index: 1;
        border-radius: 5px;
        box-shadow: 0 0 2px 2px #00000030;
      }

      .user.focus-visible {
        background-color: #00000040;
        padding: 3px 0;
        border-radius: 10px;
      }

      .user-menu {
        transition: .5s;
      }

      .user-menu[hidden] {
        transform: translateY(-300px);
      }

      .item {
        outline: none;
      }

  `;}

  render() {
    return html`
      <nav>
        <span class='item tag-name'>Imaginarium</span>
        <span class='item volume-toggle icon' tabindex=0
        @keydown=${({key}) => (key === ' ' || key === 'Enter') ? this.userMenu.toggleVolume() : ""}
        @click=${() => this.userMenu.toggleVolume()}
        >${this.volumeIcon}</span>
        <span class='separator'></span>
        <span class='item user' tabindex=0 
        @click=${this.userMenuClick}
        @focusin=${this.userMenuFocus}
        @focusout=${() => this.userMenu.hidden = true}
        >
          <span class='user-name'>${api.host.name}</span>
          <img class='user-img' src="${api.host.avatar.img}"
          style="background-color: ${api.host.avatar.color}">

          <im-usermenu class='user-menu' .user=${api.host} 
          @volumeChange=${({volume}) => this.volumeIcon = volume.icon}
          ></im-usermenu>
        </span>
      </nav>
    `;
  }

  static get properties() {
    return {
      volumeIcon: { type: Object },
    }
  }

  constructor() {
    super();
    window.applyFocusVisiblePolyfill(this.shadowRoot);
  }

  firstUpdated() {
    this.userMenu = this.shadowRoot.querySelector('.user-menu');
    this.userMenu.hidden = true;
    this.volumeIcon = this.userMenu.getVolume().icon;
  }

  userMenuFocus() {
    this.okCheck = false;
    this.userMenu.hidden = false;
    setTimeout(() => this.okCheck = true, 100);
  }

  userMenuClick(event) {
    if (!this.okCheck) return;

    const menu = this.userMenu.getBoundingClientRect();
    const coords = {
      x: event.clientX,
      y: event.clientY
    }
    const inWidth = coords.x >= menu.left && coords.x <= menu.right;
    const inHeight = coords.y >= menu.top && coords.y <= menu.bottom;
    const inBox = inWidth && inHeight;
    if (!inBox) event.currentTarget.blur();
  }


  toggleUserMenu() {
    if (!this.userMenu.hidden) return;
    this.okCheck = false;
    this.userMenu.hidden = false;
    setTimeout(() => this.okCheck = true, 100);
  }
}

customElements.define('im-navbar', ImNavbar);
