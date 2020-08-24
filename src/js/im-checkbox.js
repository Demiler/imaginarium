import { LitElement, css, html } from 'lit-element'
import * as icons from './icons.js'

class Checkbox extends LitElement {
  static get styles() {
    return css`
      /* Customize the label (the container) */
      :host {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
        outline: none;
        cursor: pointer;
        --background: #43435f;
        --background-active: #4747aa;
        --background-hover: #5a5a99;
        --icon-color: #eee;
        --size: 20px;
      }

      .mark {
        display: inline-block;
        width: var(--size);
        height: var(--size);
        background-color: var(--background);
        border-radius: 5px;
      }

      :host(:hover) .mark {
        background-color: var(--background-hover);
      }

      :host([checked]) .mark {
        background-color: var(--background-active);
      }

      svg {
        color: var(--icon-color);
      }
      
      label {
        margin-left: 8px;
      }

    `;
  }

  constructor() {
    super();
    this.checked = false;
    this.tabIndex = 0;
    this.onclick = () => this.toggleMe();
  }

  toggleMe() {
    this.checked = !this.checked;
    this.toggleAttribute('checked');
    const event = new Event('checked');
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <span class='mark'>${this.checked ? icons.check : ''}</span>
      <label>${this.label}</label>
    `;
  }

  static get properties() {
    return {
      checked: { type: Boolean },
    }
  }
}

customElements.define('im-checkbox', Checkbox);
