import { LitElement, css, html, nothing } from 'lit-element'
import * as icons from './icons.js'

class Input extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        --box-shadow-color: #000000b3;
        --placeholder-color: #7f7f7f;
        --placeholder-bg: #35354f;
        --text-color: #eee;
        --background: #2b2b3f;
        --background-focus: #35354f;
      }

      :host {
        position: relative;
        background-color: var(--background);
        height: 25px;
        border-radius: 5px;
        transition: .2s;
        box-shadow: 0 0 0px 0px var(--box-shadow-color);
        padding: 2px 7px;
        display: flex;
        align-items: center;
      }

      .placeholder {
        position: absolute;
        left: 4px;
        color: var(--placeholder-color);
        font-size: 14px;
        transition: 0.2s;
        user-select: none;
        padding: 0 2px; 
        border-radius: 5px;
      }

      :host(:not(.empty)) .placeholder,
      :host(.focus) .placeholder {
        background-color: var(--placeholder-bg);
        transform: translateY(-15px);
        font-size: 10px;
        left: 10px;
      }

      input {
        border: none;
        color: #eee;
        outline: none;
        padding: 0;
        background-color: transparent;
        width: 100%;
        height: 100%;
        z-index: 1;
        font-size: 14px;
        font-family: "Hack";
      }

      :host(.focus) {
        box-shadow: 0 0 3px 1px var(--box-shadow-color);
        background-color: var(--background-focus);
      }
    `;
  }

  render() {
    this.empty ? 
      this.classList.add('empty') :
      this.classList.remove('empty');

    return html`
      <input spellcheck='false' autocomplete='off'
       .value=${this.value} @change=${this.inputValue}
       @input=${this.saveValue} @focus=${this.focusInput}
       @blur=${this.blurInput}>
      <span class='placeholder'>${this.placeholder}</span>
    `;
  }

  saveValue({ currentTarget }) {
    this.value = currentTarget.value;
    this.empty = this.value === '';
  }

  focusInput() {
    this.classList.add('focus');
  }

  blurInput() {
    this.classList.remove('focus');
  }


  constructor() {
    super();
    this.empty = true;
    this.placeholder = 'Hello threre'
    this.value = '';
  }

  static get properties() {
    return {
      value: { type: String },
      empty: { type: Boolean },
    }
  }
}

customElements.define('im-input', Input);

