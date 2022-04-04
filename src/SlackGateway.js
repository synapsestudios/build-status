const got = require("got");

class SlackGateway {
  #_slackAuthToken = "";
  constructor(slackAuthtoken) {
    if (!slackAuthtoken) throw new Error("token is required");
    this.#_slackAuthToken = slackAuthtoken;
  }

  getToken() {
    return this.#_slackAuthToken;
  }

  async _postRequest(method, body) {
    const response = await got.post(`https://slack.com/api/${method}`, {
      headers: {
        Authorization: `Bearer ${this.#_slackAuthToken}`,
      },
      json: body,
      responseType: "json",
    });
    if (!response.body.ok) throw new Error(response.body.error);
    return response.body;
  }

  async sendNewMessage(channel, message) {
    if (!channel) throw new Error("channel is required");
    const response = await this._postRequest("chat.postMessage", {
      ...message,
      channel: channel,
    });
    return response;
  }
}

module.exports = SlackGateway;
