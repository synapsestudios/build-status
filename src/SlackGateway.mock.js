const { SlackGatewayRoot } = require("./SlackGateway");
const sinon = require("sinon");

class SlackMessage extends SlackGatewayRoot {
  #_spies;

  constructor() {
    super();
    this.#_spies = {
      sendNewMessage: sinon.stub(),
      updateMessage: sinon.stub(),
      fetchMessage: sinon.stub(),
    };
  }

  async sendNewMessage(channel, message) {
    return this.#_spies.sendNewMessage(channel, message);
  }

  async updateMessage(channel, ts, message) {
    return this.#_spies.updateMessage(channel, ts, message);
  }

  async fetchMessage(channel, ts) {
    return this.#_spies.fetchMessage(channel, ts);
  }

  getStub(method) {
    return this.#_spies[method];
  }
}

module.exports = SlackMessage;
