class clientArray extends Array {
  has(id) { //retun if player with this id contains in array
    return this.find(
      cl => cl.player.id === id
      ) ? true : false;
  }

  findInd(id) { //returns index by client id
    return this.findIndex(
      cl => cl.player.id === id
    );
  }

  findId(id) { //returns client by id
    return this.find(
      cl => cl.player.id === id
    );
  }

  set(client) { //updates or sets data
    const ind = this.findInd(client.player.id);
    if (ind !== -1)
      this[ind] = client;
    else
      this.push(client);
  }

  delete(id) { //not efficient but for small arrys ok.
    const ind = this.findInd(id) + 1
    if (!ind) return undefined;

    let ret = this[ind - 1];
    for (let i = ind; i < this.length; i++)
      this[i - 1] = this[i];
    return ret;
  }

  mapa(cb) {
    return Array.from(this, cl => cb(cl));
  }

  toJSON() {
    return this.map(cl => cl.player);
  }
}

module.exports = { clientArray };
