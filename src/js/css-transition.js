import { LitElement, css, html } from 'lit-element'

class CSSTransition extends LitElement {
  static get properties() {
    return {
      in: { type: Boolean },
      timeout: { type: Number },
    }
  }

  constructor() {
    super();
    this.timeout = 1000;
  }

  addAttr(attr) {
    this.setAttribute(attr, '');
  }

  removeAttr(attr) {
    this.getAttributeNames().forEach(name => {
      if (name.startsWith(attr))
        this.removeAttribute(name);
    });
  }

  enter() {
    this.addAttr('enter');
    return 'active';
  }

  entering() {
    this.addAttr('enter-active');
    //this.removeAttribute('enter');
    return 'done';
  }

  entered() {
    this.addAttr('enter-done');
    this.removeAttribute('enter-active');
    return 'after-done';
  }

  playEnter() {
    switch (this.state) {
      case 'base':   this.now = this.enter;    break;
      case 'active': this.now = this.entering; break;
      case 'done':   this.now = this.entered;  break;
      default: clearInterval(this.enterInterval);
    }
    this.state = this.now(); //returns next state
  }

  initEnter(startState = 'base') {
    clearInterval(this.exitInterval);
    this.removeAttr('exit');

    this.state = 'base';
    this.playEnter();
    this.state = startState;
    setTimeout(() => this.playEnter(), 10);
    this.enterInterval = setInterval(() => {
      this.playEnter();
    }, this.timeout);
  }

  exit() {
    this.addAttr('exit');
    return 'active';
  }

  exiting() {
    this.addAttr('exit-active');
    //this.removeAttribute('exit');
    return 'done';
  }

  exited() {
    this.addAttr('exit-done');
    this.removeAttribute('exit-active');
    return 'after-done';
  }

  playExit() {
    switch (this.state) {
      case 'base':   this.now = this.exit;    break;
      case 'active': this.now = this.exiting; break;
      case 'done':   this.now = this.exited;  break;
      default: clearInterval(this.exitInterval);
    }
    this.state = this.now(); //returns next state
  }

  initExit(startState = 'base') {
    clearInterval(this.enterInterval);
    this.removeAttr('enter');

    this.state = 'base';
    this.playExit();
    this.state = startState;
    setTimeout(() => this.playExit(), 10);
    this.exitInterval = setInterval(() => {
      this.playExit();
    }, this.timeout);
  }

  updateState() {
    if (this.in) this.initEnter('active');
    else this.initExit('active');
  }

  firstUpdated() {
    this.allowUpdate = true;
    this.state = 'done';
    this.is ? this.playEnter() : this.playExit();
  }

  render() {
    if (this.allowUpdate) this.updateState();
    return html`
      <slot></slot>
    `;
  }

}
customElements.define('css-transition', CSSTransition); 
