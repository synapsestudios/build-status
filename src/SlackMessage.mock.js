const { SlackMessageRoot } = require("./SlackMessage");
const sinon = require("sinon");

class SlackMessage extends SlackMessageRoot {
  #_mockTs;
  #_ts;
  #_spies;

  constructor(ts) {
    super();
    this._mockTs = ts;
    this._spies = {
      initialize: sinon.spy(),
      appendBlock: sinon.spy(),
    };
  }

  async initialize(message) {
    this._ts = this._mockTs;
    this._spies.initialize(message);
    return;
  }

  get ts() {
    return this._ts;
  }

  async sendBlock(block) {
    this._spies.appendBlock(block);
    return;
  }

  getSpy(method) {
    return this._spies[method];
  }
}

module.exports = SlackMessage;
