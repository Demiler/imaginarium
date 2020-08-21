import { LitElement, html, css } from 'lit-element'
import * as icons from './icons.js'
import './im-slider.js'

class UserMenu extends LitElement {
  static get styles() { 
    return css`
      :host {
        display: block;
      }

      .user {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: default;
      }

      .user .user-img img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
      }

      .user .user-img {
        position: relative;
        cursor: pointer;
        outline: none;
      }

      .user .user-img.focus-visible img,
      .user .user-img:hover img {
        filter: brightness(.5);
      }

      .user .user-img.focus-visible:after,
      .user .user-img:hover:after {
        content: 'Change';
        width: 81px;
        height: 81px;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .user .user-name {
        margin: 8px 0;
      }

      .item {
        border-top: 2px solid #222233a0;
        padding: 5px;
        display: flex;
        transition: .1s;
        align-items: center;
      }

      .logout.focus-visible,
      .preference.focus-visible,
      .logout:hover,
      .preference:hover {
        background-color: #444455;
      }

      .item .icon {
        margin-right: 8px;
        display: flex;
      }

      .icon svg {
        width: 20px;
        height: 20px;
      }

      .volume-slider .percent {
        width: 66px;
        text-align: end;
        margin-left: 8px;
      }

      .slider {
        width: 100%;
        height: 20px;
        --thumb-width: 20px;
        --track-color: #222233;
        --track-color-focus: #666677;
        --thumb-color: #484876;
      }
      
      .item {
        outline: none;
      }
    `;
  }

  constructor() {
    super();
    window.applyFocusVisiblePolyfill(this.shadowRoot);
    this.volume = {
      icon: icons.volume,
      value: 100,
      oldValue: 100,
    }
  }

  getVolume() {
    return this.volume;
  }

  fireVolumeChange() {
    const volumeChange = new Event('volumeChange');
    volumeChange.volume = this.volume;
    this.dispatchEvent(volumeChange);
  }

  firePreference({ currentTarget }) {
    const preference = new Event('preference');
    this.dispatchEvent(preference);
  }

  fireLogout({ currentTarget }) {
    const logout = new Event('logout');
    this.dispatchEvent(logout);
  }

  fireAvatarChange({ currentTarget }) {
    const avatarChange = new Event('avatarChange');
    this.dispatchEvent(avatarChange);
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
    this.fireVolumeChange();
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
    this.fireVolumeChange();
  }

  render() {
    return html`
      <span class='user'>
        <span class='user-img' tabindex=0 
        @click=${this.fireAvatarChange}>
          <img class='' src="${this.user.avatar.img}"
          style="background-color: ${this.user.avatar.color}"
          >
        </span>
        <span class='user-name'>${this.user.name}</span>
      </span>

      <span class='item volume-slider'>
        <span class='icon' @click=${this.toggleVolume}
        >${this.volume.icon}</span>
        <im-slider class='slider' .value=${this.volume.value}
         @valueChange=${this.changeVolume}
        ></im-slider>
        <span class='percent'>${this.volume.value}%</span>
      </span>

      <span tabindex=0 class='item preference'
      @click=${this.firePreference}>
        <span class='icon'>${icons.gear}</span>
        <span class='text'>Preference</span>
      </span>

      <span tabindex=0 class='item logout'
      @click=${this.fireLogout}>
        <span class='icon'>${icons.door}</span>
        <span class='text'>Log out</span>
      </span>
    `;
  }
}

customElements.define('im-usermenu', UserMenu);
