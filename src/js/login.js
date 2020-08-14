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
    this.user = { login: '', password: '' };
    this.showPassword = false;
    this.logtype = 'login';
    api.on('loginNotFound', () => this.error(`${this.user.login} not found`));
    api.on('incorrectPassword', () => this.error('Password is incorrect'));
    api.on('loginUnavailable', () => this.error(`${this.user.login} is already taken`));
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
          <div class='input login-input'>
            <img src="/assets/icons/person-fill.svg">
            <input placeholder='Username'
             value=${this.user.login} @change=${this.inputLogin}
             @keydown=${this.moveToPass} @focus=${this.focusInput}
             @blur=${this.blurInput}>
          </div>
          <div class='input passw-input'>
            <img src="/assets/icons/lock-fill.svg">
            <input id="passw-inp" type='password' placeholder='Password'
             value=${this.user.password} @change=${this.inputPassword}
             @keydown=${this.passLogin} @focus=${this.focusInput}
             @blur=${this.blurInput}>
            <span id="eye" @click=${this.showPassw}>
              <img src="/assets/icons/eye-fill.svg">
            </span>
          </div>

          <label id='rememberme'>
            <input type='checkbox' checked='checked'>
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
    this.curTab = this.logTab;
    this.btnText = "Login";
  }

  focusInput(event) {
    event.target.parentElement.classList.add('focus');
  }

  blurInput(event) {
    event.target.parentElement.classList.remove('focus');
  }

  moveToPass(event) {
    if (event.key === 'Enter')
      this.pass.focus()
  }

  passLogin(event) {
    if (event.key === 'Enter') {
      this.user.password = this.pass.value;
      this.continue();
    }
  }

  showPassw() {
    this.eye.classList.toggle('slash');
    this.pass.type = this.pass.type === 'password' ?
      'text' : 'password';
  }

  inputLogin(event) {
    this.user.login = event.target.value;
  }

  inputPassword(event) {
    this.user.password = event.target.value;
  }

  tabChange(event) {
    if (event.currentTarget === this.curTab) return;
    this.curTab.classList.remove('current');

    if (this.curTab === this.logTab) {
      this.curTab = this.regTab;
      this.rembme.classList.add('hide');
      this.btnText = "Register";
      this.logtype = 'register';
    }
    else {
      this.curTab = this.logTab;
      this.rembme.classList.remove('hide');
      this.btnText = "Login";
      this.logtype = 'login';
    }

    this.curTab.classList.add('current');
  }

  error(msg) {
    clearTimeout(this.errorTimeout);
    this.errorMsg = msg;
    this.err.classList.add('show');
    this.errorTimeout = setTimeout(() => {
      this.err.classList.remove('show');
      this.errorMsg = undefined;
    }, 2000);
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
    else if (this.btnText === 'Register' && this.user.login.toLowerCase() === 'chalker') {
      setTimeout(() => {
        if (this.errorMsg) return;
        this.sound.play();
        this.renderRoot.querySelector('#popup').classList.add('show');
        this.renderRoot.querySelector('button').classList.add('popup');
        this.btnText = 'Ok, no problem'
      }, 200);
    }
    else {
      api.sendServer('userLogin', { type: this.logtype, user: this.user });
      api.login = this.user.login;
      localStorage.setItem('login', api.login);
    }
    
    
  }

  createRenderRoot() { return this }
}

customElements.define('im-login', Login); 
