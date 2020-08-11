class Player {
  static get properties() {
    return {
      id: { type: String },
      name: { type: String },
      color: { type: String },
      icon: { type: String },
      score: { type: Number },
      status: { type: String },
    };
  }

  constructor(
    id, 
    name = 'guest', 
    color = '#232323',
    icon = '0.png', 
    status = 'not-ready', 
    score = 0
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.icon = icon;
    this.status = status;
    this.score = score;
  }

  toJSON() {
    return { 
      id: this.id,
      name: this.name, 
      color: this.color,
      icon: this.icon, 
      status: this.status, 
      score: this.score 
    };
  }

  static fromJSON(data) {
    return new Player(
      data.id,
      data.name, 
      data.color,
      data.icon, 
      data.status, 
      data.score
  )}
}

module.exports = { Player };
