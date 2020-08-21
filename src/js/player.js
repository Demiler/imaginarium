class Player {
  static get properties() {
    return {
      id: { type: String },
      name: { type: String },
      avatar: { type: Object },
      score: { type: Number },
      status: { type: String },
    };
  }

  constructor(
    id = '1',
    name = 'guest', 
    avatar = { img: '../../img/avatars/0.png', color: "#232323" },
    status = 'not-ready', 
    score = 0
  ) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.status = status;
    this.score = score;
  }

  toJSON() {
    return { 
      id: this.id,
      name: this.name, 
      avatar: this.avatar, 
      status: this.status, 
      score: this.score 
    };
  }

  static fromJSON(data) {
    return new Player(
      data.id,
      data.name, 
      data.avatar, 
      data.status, 
      data.score
  )}
}

module.exports = { Player };
