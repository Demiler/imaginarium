class Logger {
  constructor() {
    this.logs = new Map();
  }

  setLog(from, receive = true) {
    this.logs.set(from, receive);
  }

  hideLog(from) {
    if (this.logs.has(from))
      this.logs.set(from, false);
    else
      this.do('logger', from + ' log is not found');
  }

  showLog(from) {
    if (this.logs.has(from))
      this.logs.set(from, true);
    else
      this.do('logger', from + ' log is not found');
  }

  do(from, msg) {
    let log = this.logs.get(from);
    if (log)
      console.log(msg);
    if (log === undefined)
      this.do('logger', from + ' log is not found');
  }
}

const log = new Logger();
log.setLog('logger');

module.exports = { log }
