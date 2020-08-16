import { LitElement, html } from 'lit-element'
import { api } from './api.js'
import '../css/login-style.css';

class Login extends LitElement {
  static get properties() {
    return {
      btnText: { type: String },
      errorMsg: { type: String },
    };
  }

  constructor() {
    super();
    this.sound = new Audio('/audio/sound1.wav');
    this.sound.volume = .2;
    this.user = { login: '', password: '', email: '', remeber: false };
    this.showPassword = false;
    this.logtype = 'login';
    api.on('loginError', (err) => this.error(err));
    api.on('checkLogin', (has) => {
      this.logCheck.classList.remove('waiting');
      if (has || !/^[a-zA-Z1-9_-]*$/.test(this.login.value)) 
        this.logCheck.classList.add('not-ok');
      else
        this.logCheck.classList.add('ok');
    });
    api.on('checkMail', (has) => {
      this.mailCheck.classList.remove('waiting');
      if (has || !/\S+@\S+\.\S+/.test(this.email.value))
        this.mailCheck.classList.add('not-ok');
      else
        this.mailCheck.classList.add('ok');
    });
  }

  render() {
    return html`
      <div class='login-container'>
        <header class='header'>
          <span id="login" class='tab current' @click=${this.tabChange}>
            <span class='text'>Login</span>
            <hr class="underline">
          </span>
          <span id="register" class='tab' @click=${this.tabChange}>
            <span class='text'>Register</span>
            <hr class="underline">
          </span>
        </header>
        <span id="error">${this.errorMsg}</span>
        <div class='input-group'>
          <div class='input login-input
            ${/^ *$/.test(this.user.login) ? "empty" : "fill"}'>
            <img src="/assets/icons/person-fill.svg">
            <input id='login-inp' spellcheck='false'
             value=${this.user.login} @change=${this.inputLogin}
             @keydown=${this.keyLogin} @focus=${this.focusInput}
             @blur=${this.blurInput}>
            <span class='placeholder'>Login</span>
            <div id="logcheck" class='spinner waiting hide'>
              <div class='double-bounce1'></div>
              <div class='double-bounce2'></div>
            </div>
          </div>

          <div class='input passw-input
            ${/^ *$/.test(this.user.password) ? "empty" : "fill"}'>
            <img src="/assets/icons/lock-fill.svg">
            <input id="passw-inp" type='password' spellcheck='false'
             value=${this.user.password} @change=${this.inputPassword}
             @keydown=${this.keyPassword} @focus=${this.focusInput}
             @blur=${this.blurInput}>
            <span class='placeholder'>Password</span>
            <span id="eye" @click=${this.showPassw}>
              <img src="/assets/icons/eye-fill.svg">
            </span>
          </div>

          <div class='input email-input 
            ${/^ *$/.test(this.user.email) ? "empty" : "fill"}'>
            <img src="/assets/icons/mailbox2.svg">
            <input id="email-inp" spellcheck='false'
             value=${this.user.email} @change=${this.inputEmail}
             @keydown=${this.keyMail} @focus=${this.focusInput}
             @blur=${this.blurInput}>
            <span class='placeholder'>Email</span>
            <div id="mailcheck" class='spinner waiting hide'>
              <div class='double-bounce1'></div>
              <div class='double-bounce2'></div>
            </div>
          </div>

          <label id='rememberme'>
            <input @change=${this.checkBox} type='checkbox'>
            <span class='checkmark'></span>
            <span class='text'>Remember me</span>
          </label>
        </div>

        <button class='btn btn-cont' @click=${this.continue}>
          ${this.btnText}
        </button> 
        <div id="popup">
          <span>Hey, we both know that 
          there's no verefication, so 
          don't be a bad person and
          abuse it.</span>
        </div>
      </div>
    `;
  }

  firstUpdated() {
    this.logTab = this.renderRoot.querySelector('#login');
    this.regTab = this.renderRoot.querySelector('#register');
    this.rembme = this.renderRoot.querySelector('#rememberme');
    this.err    = this.renderRoot.querySelector('#error');
    this.pass   = this.renderRoot.querySelector('#passw-inp');
    this.eye    = this.renderRoot.querySelector('#eye');
    this.logCheck  = this.renderRoot.querySelector('#logcheck');
    this.mailCheck = this.renderRoot.querySelector('#mailcheck');
    this.email  = this.renderRoot.querySelector('#email-inp');
    this.emailWrap  = this.renderRoot.querySelector('.email-input');
    this.login  = this.renderRoot.querySelector('#login-inp');
    this.emailWrap.classList.add('hide');
    this.curTab = this.logTab;
    this.btnText = "Login";

  }

  checkBox(event) {
    this.user.remeber = event.target.checked;
  }

  focusInput(event) {
    event.target.parentElement.classList.add('focus');
    this.requestUpdate();
  }

  blurInput(event) {
    event.target.parentElement.classList.remove('focus');
    this.requestUpdate();
  }

  keyLogin(event) {
    clearTimeout(this.reglogto);

    if (event.key === 'Enter')
      this.pass.focus()
    if (this.logtype === 'register')
      this.reglogto = 
        this.checkValid(this.logCheck, 'checkLogin', event);
  }

  keyPassword(event) {
    if (event.key === 'Enter') {
      this.user.password = this.pass.value;
      if (this.logtype === 'register')
        this.email.focus();
      else
        this.continue();
    }
  }

  keyMail(event) {
    clearTimeout(this.regmailto);

    if (event.key === 'Enter') {
      this.user.email = this.email.value;
      this.continue();
    }
    if (this.logtype === 'register')
      this.regmailto =
        this.checkValid(this.mailCheck, 'checkMail', event);
  }

  checkValid(what, serMsg, event) {
    if (event.key === 'Backspace' || event.key === 'Enter' || (
          !event.altKey && 
          !event.ctrlKey && 
          /^[a-zA-Z1-9_-]$/.test(event.key)
        )
    ) {
      what.classList.remove('not-ok');
      what.classList.remove('ok');
      what.classList.add('waiting');
      return setTimeout(() => {
        api.sendServer(serMsg, event.target.value);
      }, 400);
    }
  }

  showPassw() {
    this.eye.classList.toggle('slash');
    this.pass.type = this.pass.type === 'password' ?
      'text' : 'password';
  }

  inputLogin(event) {
    event.target.value = event.target.value.trim();
    this.user.login = event.target.value;
  }

  inputPassword(event) {
    event.target.value = event.target.value.trim();
    this.user.password = event.target.value;
  }

  inputEmail(event) {
    event.target.value = event.target.value.trim();
    this.user.email = event.target.value;
  }

  tabChange(event) {
    if (event.currentTarget === this.curTab) return;
    this.curTab.classList.remove('current');

    if (this.curTab === this.logTab) {
      this.curTab = this.regTab;
      this.rembme.classList.add('hide');
      this.btnText = "Register";
      this.logtype = 'register';
      this.logCheck.classList.remove('hide');
      this.mailCheck.classList.remove('hide');
      this.emailWrap.classList.remove('hide');
      this.checkValid(this.logCheck, 'checkLogin', 
        { key: this.user.login[0], target: this.logCheck });
    }
    else {
      this.curTab = this.logTab;
      this.rembme.classList.remove('hide');
      this.btnText = "Login";
      this.logtype = 'login';
      this.logCheck.classList.add('hide');
      this.mailCheck.classList.add('hide');
      this.emailWrap.classList.add('hide');
    }

    this.curTab.classList.add('current');
  }

  error(msg, time = 3000) {
    clearTimeout(this.errorTimeout);
    this.errorMsg = msg;
    this.err.classList.add('show');
    this.errorTimeout = setTimeout(() => {
      this.err.classList.remove('show');
      this.errorMsg = undefined;
    }, time);
  }

  continue() {
    if (/^ *$/.test(this.user.login))
      this.error('Input login!');
    else if (/^ *$/.test(this.user.password))
      this.error('Input password!');
    else if (!/^[a-zA-Z1-9_-]*$/.test(this.user.login))
      this.error('Invalid symbols in login!');
    else if (!/^[a-zA-Z1-9_-]*$/.test(this.user.password))
      this.error('Invalid symbols in password!');
    else if (this.logtype === 'register') {
      if (/^ *$/.test(this.user.email))
        this.error('Input email!');
      else if (!/\S+@\S+\.\S+/.test(this.user.email))
        this.error('Invalid email!');
      else
        this.sendData();
    }
    else 
      this.sendData();
    
  }

  sendData() {
    api.sendServer('userLogin', { type: this.logtype, user: this.user });
    api.login = this.user.login;
    localStorage.setItem('login', api.login);
  }

  createRenderRoot() { return this }
}

customElements.define('im-login', Login); 
