import { LitElement, css, html } from 'lit-element'
import './css-transition.js'
import * as icons from './icons.js'

class SortDropdown extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        position: relative;
        --background: #434353;
        --background-hover: #535363;
      }

      label {
        display: flex;
        background-color: var(--background);
        align-items: center;
        justify-content: space-between;
        padding: 5px;
        border-radius: 5px;
        position: relative;
        z-index: 2;
        height: inherit;
        user-select: none;
      }

      label .icon {
        width: 20px;
        height: 20px;
        right: 5px;
        top: calc(50% - 10px);
        transition: .2s;
      }

      label .icon.up {
        transform: rotate(0);
      }

      label .icon.down {
        transform: rotate(180deg);
      }

      .drop-down[hidden],
      .drop-down {
        position: absolute;
        width: 100%;
        left: -5%;
        top: 105%;
        padding: 5%;
        overflow: hidden;
        transition: top .5s;
        display: block;
        outline: none;
      }

      .items {
        box-shadow: 0 0 2px 2px #000000a0;
        display: flex;
        flex-direction: column;
        background-color: var(--background);
        padding: 3px;
        border-radius: 5px;
        transition: .5s;
      }

      .drop-down ::slotted(*) {
        padding: 3px 3px;
        margin: 2px 0;
        border-radius: 5px;
        user-select: none;
        cursor: pointer;
      }

      .drop-down ::slotted(*:hover) {
        background-color: var(--background-hover);
      }

      .drop-down[hidden] .items {
        transform: translateY(-110%);
      }

      .drop-down.hide {
        display: none;
      }

    `;
  }

  constructor() {
    super();
    [this.selected] = this.children;
    this.open = false;
    this.okToCheck = true;
  }

  firstUpdated() {
    this.dropdown = this.shadowRoot.querySelector('.drop-down');
    this.label = this.shadowRoot.querySelector('label');
    this.items = this.shadowRoot.querySelector('.items');

    this.dropdown.classList.add('hide');
    this.dropdown.hidden = true;
  }

  umountDropdown(event) {
    if (event.currentTarget === event.target) return;
    if (this.open) return;
    event.currentTarget.classList.add('hide');
  }

  isLabel(target) {
    if (target === this.label) return true;
    if (target === this.label.children[0]) return true;
    if (target === this.label.children[1]) return true;
    return false;
  }

  toggleDropdown(event) {
    if (!this.okToCheck) return;

    this.okToCheck = false;
    this.open = !this.open;
    if (this.open) {
      this.dropdown.classList.remove('hide');
      this.dropdown.hidden = true;
      this.dropdown.focus();
      setTimeout(() => this.dropdown.hidden = false, 10);
    }
    else
      this.dropdown.hidden = true;
    setTimeout(() => this.okToCheck = true, 200);
  }

  choose(event) {
    if (event.target === this.items) return;
    this.selected = event.target;
    const choosed = new Event('choosed');
    this.dispatchEvent(choosed);
  }

  render() {
    return html`
      <label @click=${this.toggleDropdown}>
        <span class='text'>Sort by ${this.selected.innerText}</span>
        <span class='icon ${this.open ? 'up' : 'down'}'>${icons.chevronDown}</span>
      </label>
      <div class='drop-down' tabIndex="0"
       @transitionend=${this.umountDropdown}
       @focusout=${this.toggleDropdown}
      >
        <slot class='items'
         @mousedown=${this.choose}
        ></slot>
      </div>
    `;
  }

  static get properties() {
    return {
      open: { type: Boolean },
      selected: { type: Object },
    }
  }
}

customElements.define('im-sortdd', SortDropdown);
