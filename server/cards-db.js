const uuid = require('uuid');
const fs = require('fs');
const { log } = require('./logger.js');

const lm = 'card-db'; //lm = log me
log.setLog(lm, true);

class Card { 
  constructor(path) {
    this.id = uuid.v4();
    this.path = path;
    this.timeUsed = 0;
    this.usedThisGame = false;
  }

  toJSON() {
    return {
      id: this.id,
      path: this.path,
      timeUsed: this.timeUsed
    }
  }

  static fromJSON(data) {
    this.id = data.id;
    this.path = data.path;
    this.usedThisGame = false;
    this.timeUsed = data.timeUsed;
    return this;
  }
}

class CardsDB {
  constructor() {
    this.cards = [];
    this.last = 0;
    this.dir = './img/cards/';
    this.dbfile = './db-info.json';
    this.loadDataBase();
  }

  loadDataBase() {
    if (fs.existsSync(this.dbfile)) {
      log.do(lm, 'reading existsing data base');
      this.cards = JSON.parse(
        fs.readFileSync(this.dbfile, 'utf8'));
    }
    else {
      log.do(lm, 'Data Base not found!\nCreating new one...');
      this.cards = fs.readdirSync(this.dir).map(
        card => new Card(card));
    }

  }

  saveDataBase() { 
    log.do(lm, 'Saving data base');
    fs.writeFileSync(
      this.dbfile,
      JSON.stringify(this.cards),
      'utf8');
  }

  length(unused = true) {
    return this.cards.reduce((len, card) => 
      (unused && card.usedThisGame || !unused) ? len + 1 : len);
  }

  getNCards(n, unused = true) {
    if (this.length(unused) < n) 
      return log.do(lm, 'error: not enough cards');

    for (let i = this.last; i < this.last + n; i++)
      this.cards[i].usedThisGame = true;

    this.last += n;
    
    return this.cards.slice(this.last - n, this.last);
  }
}

const cardsDB = new CardsDB();
module.exports = { cardsDB, Card }
