const md5 = require('md5');
const gravatar = require('gravatar');
const { getColor } = require('./colors.js');

class Client {
  constructor() {
    this.avatarType = 
      ['mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'blank'];
    this.profile = {
      id: undefined,
      name: undefined,
      login: undefined,
      email: undefined,
      password: undefined,
      avatar: {
        img: undefined,
        color: undefined,
      }
    }
    this.game = {
      score: 0,
      cards: [],
      status: 'not-ready',
      guessed: undefined,
      choosen: undefined,
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

  newAvatar() {
    const type = this.avatarType[this.avatarType.length * Math.random() | 0];
    this.profile.avatar.img = 
      gravatar.url(this.profile.email, {
        size: '256', 
        d: type
      }, true);
    return this.profile.avatar;
  }
}

module.exports = { Client };
