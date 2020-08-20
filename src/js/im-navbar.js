import { LitElement, html, css } from 'lit-element'
import './navbar.js';
import { api } from './api.js'
import * as icons from './icons.js'
import './im-slider.js'
import './css-transition.js'

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

    .user-menu .user {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-left: 0;
    }

    .user-menu .user .user-img {
      width: 80px;
      height: 80px;
      margin-left: 0;
    }

    .user-menu .user .user-name {
      margin: 8px 0;
    }

    .user-menu .item {
      border-top: 2px solid #222233a0;
      padding: 5px;
      display: flex;
      transition: .2s;
      align-items: center;
    }

    .user-menu .logout:hover,
    .user-menu .preference:hover {
      background-color: #444455;
    }

    .user-menu .item .icon {
      margin-right: 8px;
      display: flex;
    }

    .user-menu .volume-slider .percent {
      width: 66px;
      text-align: end;
      margin-left: 8px;
    }

    .user-menu .slider {
      width: 100%;
      height: 20px;
      --thumb-width: 20px;
      --track-color: #222233;
      --track-color-focus: #222233;
      --thumb-color: #484876;
    }

    .user-menu {
      transition: .5s;
    }
    .user-menu[hidden] {
      transform: translateY(-300px);
    }

  `;}

  render() {
    return html`
      <nav>
        <span class='item tag-name'>Imaginarium</span>
        <span class='item volume-toggle icon'
         @click=${this.toggleVolume}
        >${this.volume.icon}</span>
        <span class='separator'></span>
        <span class='item user' @click=${this.toggleUserMenu}>
          <span class='user-name'>${api.host.name}</span>
          <img class='user-img' src="${api.host.avatar.img}">

          <div class='user-menu'>
            <span class='user'>
              <img class='user-img' src="${api.host.avatar.img}">
              <span class='user-name'>${api.host.name}</span>
            </span>

            <span class='item volume-slider'>
              <span class='icon' @click=${this.toggleVolume}
              >${this.volume.icon}</span>
              <im-slider class='slider' .value=${this.volume.value}
               @valueChange=${this.changeVolume}
              ></im-slider>
              <span class='percent'>${this.volume.value}%</span>
            </span>

            <span class='item preference'>
              <span class='icon'>${icons.gear}</span>
              <span class='text'>Preference</span>
            </span>

            <span class='item logout'>
              <span class='icon'>${icons.door}</span>
              <span class='text'>Log out</span>
            </span>
          </div>

        </span>
      </nav>
    `;
  }

  constructor() {
    super();
    this.volume = {
      icon: icons.volume,
      value: 100,
      oldValue: 100,
    }
    this.showUserMenu = false;

    document.onclick = (event) => {
      if (!this.okCheck) return;
      const menu = this.userMenu.getBoundingClientRect();
      const coords = {
        x: event.clientX,
        y: event.clientY
      }
      const inWidth = coords.x >= menu.left && coords.x <= menu.right;
      const inHeight = coords.y >= menu.top && coords.y <= menu.bottom;
      const inBox = inWidth && inHeight;
      this.userMenu.hidden = !inBox;
    }
  }

  firstUpdated() {
    this.userMenu = this.shadowRoot.querySelector('.user-menu');
    this.userMenu.hidden = true;
  }

  toggleUserMenu() {
    if (!this.userMenu.hidden) return;
    this.okCheck = false;
    this.userMenu.hidden = false;
    setTimeout(() => this.okCheck = true, 100);
  }

  setVolumeIcon() {
    if (this.volume.value === 0)
      this.volume.icon = icons.mute;
    else if (this.volume.value <= 33)
      this.volume.icon = icons.volumeOff;
    else if (this.volume.value <= 66)
      this.volume.icon = icons.volumeLow;
    else if (this.volume.value <= 100)
      this.volume.icon = icons.volumeHigh;
  }

  changeVolume(event) {
    this.volume.value = Number(event.target.value);
    this.setVolumeIcon();
    this.requestUpdate();
  }

  toggleVolume() {
    if (this.volume.icon !== icons.mute) {
      this.volume.icon = icons.mute;
      this.volume.oldValue = this.volume.value;
      this.volume.value = 0;
    }
    else
      this.volume.value = this.volume.oldValue ;
    this.setVolumeIcon();
    this.requestUpdate();
  }
}

customElements.define('im-navbar', ImNavbar);
