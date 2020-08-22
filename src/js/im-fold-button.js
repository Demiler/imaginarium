import { LitElement, css, html } from 'lit-element'

class Foldbutton extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        height: var(--height);
        outline: none;
        --height: 20px;
        --padding: 5px;
        --background: #454555;
        --background-active: #46467c;
        --background-hover: #46467c;
        --separator: #565666;
        --radius: 5px;
        --input-width: 30px;
        --text-color: #eee;
      }

      input, .label {
        height: auto;
        transition: .3s;
        outline: 0;
        color: var(--text-color);
        text-align: center;
      }

      .label {
        display: inline;
        width: 100%;
        padding: var(--padding);
        border-radius: var(--radius);
        background-color: var(--background);
        border-color: var(--separator);
        transition: border-radius .5s;
        user-select: none;
        text-align: center;
      }

      input {
        padding: var(--padding) 0;
        border: none;
        width: 0;
        background-color: var(--background);
        border-radius: 0 var(--radius) var(--radius) 0;
      }

      :host(:hover) .label,
      :host(:hover) input {
        background-color: var(--background-hover);
      }

      :host([active]) .label {
        border-radius: var(--radius) 0 0 var(--radius);
        background-color: var(--background-active);
        border-color: var(--separator);
        border-right: 2px solid var(--separator);
        transition: border-radius .3s;
      }

      :host([active]) input {
        width: calc(var(--input-width) - 2 * var(--padding));
        background-color: var(--background-active);
        padding: var(--padding);
      }
    `;
  }

  static get properties() {
    return {
      value: { type: Number },
    }
  }

  constructor() {
    super();
    this.active = false;
    this.value = '';
    this.tabIndex = 0;
    this.onclick = (event) => {
      const clickbtn = new Event('clicked');
      this.dispatchEvent(clickbtn);
    }
  }

  firstUpdated() {
    [this.labelField, this.inputField] = this.shadowRoot.children;
    this.inputField.tabIndex = -1;
  }

  render() {
    return html`
      <slot class='label'></slot>
      <input value=${this.value} @change=${this.inputNumber} @input=${this.inputNumber}>
    `;
  }

  inputNumber() {
    const newValue = Number(this.inputField.value);
    if (Number.isNaN(newValue)) this.value = 0;
    else this.value = newValue;
    this.inputField.value = this.value;
  }

  getTarget(event) {
    const x = event.clientX;
    const y = event.clientY;
    const position = this.inputField.getBoundingClientRect();
    const isInput = 
      x >= position.left &&
      x <= position.right &&
      y >= position.top &&
      y <= position.bottom;
    return isInput ? this.inputField : this.labelField;
  }

  activate(focusInput = true) {
    this.active = true;
    this.setAttribute('active', '');
    this.inputField.tabIndex = 0;
    if (focusInput)
      this.inputField.focus();
  }

  disactivate() {
    this.active = false;
    this.removeAttribute('active');
    this.inputField.tabIndex = -1;
  }

  toggle(focusInput = true) { 
    if (this.active)
      this.disactivate();
    else
      this.activate(focusInput);
  }
}

customElements.define('im-foldbutton', Foldbutton);
