import { LitElement, html, css } from 'lit-element'

class Slider extends LitElement {
  static get styles() {
    return css`
      :host {
        --track-color: #555;
        --track-color-focus: #888;
        --border-color: transparent;
        --thumb-color: #aaa;
        --thumb-width: 10px;
        --thumb-height: 10px;
        --height: 100%;
      }

      input {
        display: block;
        width: 100%;
        background: linear-gradient(to right,
            transparent 12px,
            var(--color) 0,
            var(--color) calc(100% - 12px),
            transparent 0
          ) no-repeat 0 50% / 100% 2px;
        --color: var(--track-color);
      }
      input:focus {
        --color: var(--track-color-focus);
      }

      input {
        padding: 0;
        margin: 0;
        vertical-align: top;
        height: var(--height);
        -webkit-appearance: none;
           -moz-appearance: none;
                appearance: none;
        cursor: pointer;
        outline: none
      }
      input::range-thumb {
        -webkit-box-sizing: border-box;
                box-sizing: border-box;
        -webkit-appearance: none;
                appearance: none;
        border: 2px solid var(--borer-color);
        height: var(--thumb-height);
        width: var(--thumb-width);
        border-radius: 12px;
        background: var(--thumb-color);
      }
      input::-moz-range-thumb {
        -webkit-box-sizing: border-box;
                box-sizing: border-box;
        -webkit-appearance: none;
                appearance: none;
        border: 2px solid var(--border-color);
        height: var(--thumb-height);
        width: var(--thumb-width);
        border-radius: 12px;
        background: var(--thumb-color);
      }
      input::-webkit-slider-thumb {
        -webkit-box-sizing: border-box;
                box-sizing: border-box;
        -webkit-appearance: none;
                appearance: none;
        border: 2px solid var(--border-color);
        height: var(--thumb-height);
        width: var(--thumb-width);
        border-radius: 12px;
        background: var(--thumb-color);
      }
      input::-moz-focus-outer {
        border: 0;
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
    this.value = 0;
    this.wheelStep = 2;
  }

  render() {
    return html`
      <input type='range' .value="${this.value}"
      @input=${this.inp}
      @wheel=${this.whee}
      @keydown=${this.chng}
      >
    `
  }

  fireValueChange() {
    const valueChange = new Event('valueChange');
    this.dispatchEvent(valueChange);
  }

  chng(event) {
    const { key } = event;
    let diff = 0;
    let mult = 0;
    if (key === 'ArrowLeft') mult = -1;
    else if (key === 'ArrowRight') mult = 1;
    else return;
    if (event.shiftKey) diff += 1;
    if (event.ctrlKey) diff += 4;  
    const newValue = this.value + diff * mult

    if (newValue < 0) this.value = 0;
    else if (newValue > 100) this.value = 100;
    else this.value = newValue;
    this.fireValueChange();
  }

  inp(event) {
    this.value = Number(event.target.value);
    this.fireValueChange();
  }

  whee(event) {
    const dir = event.deltaY < 0 ? 'up' : 'down';
    if (dir === 'up')
      if (this.value + this.wheelStep > 100)
        this.value = 100;
      else
        this.value += this.wheelStep;
    else
      if (this.value - this.wheelStep < 0)
        this.value = 0;
      else
        this.value -= this.wheelStep;
    this.fireValueChange();
  }
}

class Slider2 extends LitElement {
  static get styles() {
    return css`
      :host {
        min-height: 10px;
        display: flex;
        align-items: center;
        --track: black;
        --thumb: #eee;
        --completed: #32b;
      }

      .track {
        min-width: 20px;
        width: 100%;
        height: 3px;
        border-radius: 5px;
        position: relative;
        background-color: var(--track);
      }

      .thumb {
        width: 10px;
        height: 10px;
        position: absolute;
        border-radius: 10px;
        top: -100%;
        left: 0;
        background-color: var(--thumb);
      }

      .completed {
        position: absolute;
        top: 0;
        left: 0;
        width: 0%;
        height: inherit;
        border-radius: 5px 0 0 5px;
        background-color: var(--completed);
      }

    `;
  }
  static get properties() {
    return {
      value: { type: Number }
    }
  }
  constructor() {
    super();
    this.value = 0;
    this.onclick = this.click;
  }
  render() {
    return html`
      <span class='track' @click=${this.click}>
        <span class='completed' style="width: ${this.value}px"></span>
        <span class='thumb' style="left: ${this.value}px"></span>
      </span>
    `;
  }

  click(event) {
    this.thing = event;
    const coords = {
      x: event.clientX,
      y: event.clientY
    }
    console.log(coords);
  }
}

customElements.define('im-slider', Slider);
