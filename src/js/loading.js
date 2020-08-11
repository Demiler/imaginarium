import { LitElement, html } from 'lit-element'
import '../css/loading-style.css'

class Loading extends LitElement {
  static get properties() {
    return {
    }
  }

  constructor() {
      super();

  }

  render() {
    return html`
    <div class="lds-roller">
    <div></div><div></div><div>
    </div><div></div><div></div>
    <div></div><div></div><div></div></div>
    `
  }

  createRenderRoot() { return this }
}

customElements.define('im-loading', Loading); 
