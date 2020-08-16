const md5 = require('md5');
const gravatar = require('gravatar');
const { getColor } = require('./colors.js');

class Client {
  constructor() {
    this.profile = {
      id: '',
      name: '',
      login: '',
      email: '',
      password: '',
      avatar: {
        img: '',
        color: '',
      }
    }
    this.game = {
      score: 0,
      cards: [],
      status: '',
      guessed: '',
      choosen: '',
    };
    this.timeouts = {
      offline: {},
      remove: {},
      delete: {},
      forget: {},
      clearAll: function() {
        clearTimeout(this.offline); 
        clearTimeout(this.remove); 
        clearTimeout(this.delete); 
        clearTimeout(this.forget); 
      }
    };
  }
  
  getSendable() {
    return {
      id: this.profile.id,
      name: this.profile.name,
      score: this.game.score,
      avatar: this.profile.avatar,
      status: this.game.status
    }
  }

  generate(login, email) {
    this.profile.login = login;
    this.profile.name = login;
    this.profile.avatar = {
      img: gravatar.url(email, {size: '256', d: 'identicon' }, true),
      color: getColor()
    }
    this.profile.email = email;
    this.profile.id = md5(email);
  }
}

module.exports = { Client };
