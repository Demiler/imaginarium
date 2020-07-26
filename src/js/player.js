class Player {
  static get properties() {
    return {
      id: { type: String },
      name: { type: String },
      icon: { type: String },
      score: { type: Number },
      status: { type: String },
    };
  }

  constructor(id, name = 'guest', icon = '0.png', status = 'not-ready', score = 0) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.status = status;
    this.score = score;
  }

  toJSON() {
    return { 
      id: this.id,
      name: this.name, 
      icon: this.icon, 
      status: this.status, 
      score: this.score 
    };
  }

  static fromJSON(data) {
    return new Player(
      data.id,
      data.name, 
      data.icon, 
      data.status, 
      data.score
  )};
}

module.exports = { Player };
