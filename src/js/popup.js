import { LitElement, html } from 'lit-element'

class Popup extends LitElement {
  static get properties() {
    return {
      time: { type: Number },
      animationTime: { type: Number },
      text: { type: String },
      display: { type: String }
    }
  }

  //
  constructor() {
    super();
    this.display = 'showing';
    this.renderedOnce = false;
  }

  render() {
    if (!this.renderedOnce) {
      this.renderedOnce = true;
      setTimeout(() => {
        this.display = 'show';
        setTimeout(() => {
          this.display = 'hide';
          setTimeout(() => this.display = 'hidden', this.time * 0.2);
        }, this.time * 0.6);
      }, this.time * 0.2);
    }
    return html`
      <span class="pop-up ${this.display}">
        ${this.text}
      </span>
    `
  }

  createRenderRoot() { return this }
}

customElements.define('im-popup', Popup); 
