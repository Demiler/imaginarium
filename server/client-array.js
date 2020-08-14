class clientArray extends Array {
  has(login) { //retun if player with this login contains in array
    return this.find(
      cl => cl.player.login === login
      ) ? true : false;
  }

  findInd(login) { //returns index by client login
    return this.findIndex(
      cl => cl.player.login === login
    );
  }

  findLogin(login) { //returns client by login
    return this.find(
      cl => cl.player.login === login
    );
  }

  set(client) { //updates or sets data
    const ind = this.findInd(client.player.login);
    if (ind !== -1)
      this[ind] = client;
    else
      this.push(client);
  }

  delete(login) { //not efficient but for small arrys ok.
    const ind = this.findInd(login);
    if (ind === -1) return undefined;
    return this.splice(ind, 1);
  }

  mapa(cb) {
    return Array.from(this, cl => cb(cl));
  }

  toJSON() {
    return this.map(cl => cl.player);
  }
}

module.exports = { clientArray };
