import { LitElement, css, html } from 'lit-element'
import * as icons from './icons.js'
import { isValidKey } from './utils/isValidKey.js'

class ImNumber extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        height: 20px;
        border-radius: 5px;
        align-items: center;
        justify-content: center;
        --background:  #43435f;
        --plus-color:  #b22445;
        --minus-color: #4a44a7;
        --border-color: #6a6a99;
      }

      .btn, .number {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn {
        width: 30px;
        outline: none;
        cursor: pointer;
        user-select: none;
      }

      .btn.focus-visible,
      .btn:hover {
        filter: brightness(1.2);
      }

      .btn.plus {
        background-color: var(--plus-color);
        border-radius: 0 5px 5px 0;
      }

      .btn.minus {
        background-color: var(--minus-color);
        border-radius: 5px 0 0 5px;
      }

      .number {
        background-color: var(--background);
        border: 2px solid var(--border-color);
        border-top: none;
        border-bottom: none;
        padding: 0 8px;
      }
    `;
  }

  render() {
    return html`
      <span class='btn minus' tabIndex=0 
        @keydown=${this.sub} @click=${this.sub}>-</span>
      <span class='number'>${this.value}</span>
      <span class='btn plus' tabIndex=0 
        @keydown=${this.add} @click=${this.add}>+</span>
    `;
  }

  sub({ key }) {
    if (key !== undefined && !isValidKey(key)) return;
    if (this.min === undefined || this.value - 1 >= this.min)
      this.value--;
  }

  add({ key }) {
    if (key !== undefined && !isValidKey(key)) return;
    if (this.max === undefined || this.value + 1 <= this.max)
      this.value++;
  }

  constructor() {
    super();
    this.value = 0;
  }

  firstUpdated() {
    if (this.min !== undefined)
      this.value = this.min;
    window.applyFocusVisiblePolyfill(this.shadowRoot);
  }

  static get properties() {
    return {
      value: { type: Number },
    }
  }

}

customElements.define('im-number', ImNumber);
