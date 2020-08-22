import { LitElement, css, html, nothing } from 'lit-element'

class Input2 extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        --placeholder-color: #7f7f7f;
        --text-color: #eee;
        --background: transparent;
        --background-focus: #35354f;
        --underline-color: #232333;
        --underline-color-active: #447fb2;
        --font-size: 14px;
        --font-size-small: 10px;
        --calc-top: calc(var(--font-size) * -1);
      }

      :host {
        position: relative;
        height: 25px;
        transition: .2s;
        align-items: center;
        background-color: var(--background);
        border-radius: 5px 5px 0 0;
      }

      hr {
        position: absolute;
        bottom: 0;
        left: 0;
        margin: 0;
        padding: 0;
        border: 0;
        height: 2px;
        border-radius: 5px;
      }

      .border {
        width: 100%;
        background-color: var(--underline-color);
      }

      .slider {
        width: 0%;
        transition: .2s;
        background-color: var(--underline-color-active);
      }

      :host(:not(.empty)) .slider,
      :host(.focus) .slider {
        width: 100%;
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
        font-size: var(--font-size);
        font-family: "Hack";
        position: relative;
        z-index: 1;
      }

      .placeholder {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        font-size: var(--font-size);
        display: flex;
        align-items: center;
        transition: .2s;
        color: var(--placeholder-color);
      }

      :host(:not(.empty)) .placeholder,
      :host(.focus) .placeholder {
        transform: translateY(var(--calc-top));
        font-size: var(--font-size-small);
      }

      :host(.focus) {
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
       .value=${this.value} 
       @input=${this.saveValue} @focus=${this.focusInput}
       @blur=${this.blurInput}>
      <span class='placeholder'>${this.placeholder}</span>
      <hr class='border'>
      <hr class='slider'>
    `;
  }

  saveValue({ currentTarget }) {
    this.value = currentTarget.value.trim();
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
    this.value = '';
    this.placeholder = '';
  }

  static get properties() {
    return {
      value: { type: String },
      empty: { type: Boolean },
    }
  }
}

customElements.define('im-input2', Input2);

