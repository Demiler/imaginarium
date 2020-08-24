import { LitElement, css, html } from 'lit-element'
import './css-transition.js'
import './im-sortdd.js'
import './im-checkbox.js'
import './im-number.js'
import * as icons from './icons.js'

class SearchFilter extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        --height: 30px;
        --time: 300ms;
        height: var(--height);
      }

      input {
        width: 100%;
        border: none;
        color: #eee;
        background-color: #343444;
        border-radius: 5px;
        padding: 5px 10px;
        outline: none;
      }

      .icon {
        width: 20px;
        height: 20px;
        background-color: #343444;
        border-radius: 5px;
        margin-left: 10px;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      svg {
        width: 18px;
        height: 18px;
      }

      .options {
        position: relative;
      }

      .wrap {
        position: absolute;
        top: calc(var(--height) + 5px);
        right: -5px;
        overflow: hidden;
        padding: 5px;
      }

      .wrap[exit-done] {
        display: none;
      }

      .wrap[enter] {
        display: flex;
      }


      .drop-down {
        display: flex;
        flex-direction: column;
        background-color: #343444;
        padding: 5px;
        width: 200px;
        box-shadow: 0 0 2px 2px #000000a0;
        border-radius: 5px;
        transition: var(--time);
        transform: translateY(-150px);
        z-index: 3;
      }

      [enter-done] .drop-down,
      [enter-active] .drop-down {
        transform: translateY(0);
      }

      [exit-active] .drop-down {
        transform: translateY(-150px);
      }

      .drop-down .item {
        padding: 5px 2px;
        user-select: none;
        cursor: pointer;
        border-radius: 5px;
      }

      .drop-down .item:hover {
        //background-color: #444454;
      }

      .drop-down .item:not(:last-child) {
        margin-bottom: 5px;
      }
      
      im-sortdd {
        font-size: 10px;
        height: 20px;
        margin-left: 10px;
        --background: #343444;
      }

      .number {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .number .text {
        text-align: center;
      }
    `;
  }

  render() {
    return html`
      <input>
      <div class='options'>
        <span class='icon'
         @click=${this.toggleOptions}
        >${icons.funnel}</span>
        <css-transition .in=${this.showOptions} .timeout=${this.animTime} class='wrap'>
          <div class='drop-down'>
            <im-checkbox class='item' .label=${"friends only"}></im-checkbox>
            <im-checkbox class='item' .label=${"show full"}></im-checkbox>
            <im-checkbox class='item' .label=${"show in progress"}></im-checkbox>
            <span class='item number'>
              <im-number .min=${1} .max=${8}></im-number>
              <span class='text'>minimum players</span>
            </span>
          </div>
        </css-transition>
      </div>
      <im-sortdd>
        <span>title up</span>
        <span>title down</span>
        <span>more players</span>
        <span>less players</span>
      </im-sortdd>
    `;
  }

  toggleOptions() {
    this.showOptions = !this.showOptions;
  }

  firstUpdated() {
    this.dropdown = this.shadowRoot.querySelector('.drop-down');
    this.showOptions = false;
  }

  constructor() {
    super();
    this.animTime = 300;
  }

  static get properties() {
    return {
      showOptions: { type: Boolean },
    }
  }
}

customElements.define('im-search-filter', SearchFilter);
