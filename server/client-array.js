class clientArray extends Array {
  has(id) { //retun if player with this id contains in array
    return this.find(
      cl => cl.profile.id === id
      ) ? true : false;
  }

  findInd(id) { //returns index by client id
    return this.findIndex(
      cl => cl.profile.id === id
    );
  }

  findLogin(id) { //returns client by id
    return this.find(
      cl => cl.profile.id === id
    );
  }

  set(client) { //updates or sets data
    const ind = this.findInd(client.profile.id);
    if (ind !== -1)
      this[ind] = client;
    else
      this.push(client);
  }

  delete(id) { //not efficient but for small arrys ok.
    const ind = this.findInd(id);
    if (ind === -1) return undefined;
    return this.splice(ind, 1);
  }

  mapa(cb) {
    return Array.from(this, cl => cb(cl));
  }

  toJSON() {
    return this.map(cl => cl.getSendable());
  }
}

module.exports = { clientArray };
