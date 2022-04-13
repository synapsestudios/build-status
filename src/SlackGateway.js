const got = require("got");

class SlackGatewayRoot {
  constructor() {
    if (new.target === SlackGatewayRoot) {
      throw new TypeError("Cannot construct Abstract instances directly");
    }
  }

  async sendNewMessage() {
    return;
  }
}

class SlackGateway extends SlackGatewayRoot {
  #_slackAuthToken = "";
  constructor(slackAuthtoken) {
    super();
    if (!slackAuthtoken) throw new Error("token is required");
    this.#_slackAuthToken = slackAuthtoken;
  }

  #getToken() {
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
    if (!message) throw new Error("message is required");
    if (typeof message !== "object")
      throw new Error("message is not an object");

    const response = await this._postRequest("chat.postMessage", {
      ...message,
      channel: channel,
    });
    return response;
  }

  async updateMessage(channel, ts, message) {
    await this._postRequest("chat.update", {
      text: message.text,
      channel: channel,
      ts: ts,
      blocks: message.blocks,
    });
  }

  async fetchMessage(channel, ts) {
    const historySearchParams = new URLSearchParams();
    historySearchParams.append("channel", channel);
    historySearchParams.append("latest", ts);
    historySearchParams.append("limit", 1);
    historySearchParams.append("inclusive", "true");

    try {
      const response = await got.get(
        `https://slack.com/api/conversations.history?${historySearchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.#getToken()}`,
          },
          responseType: "json",
        }
      );
      return response;
    } catch (e) {
      const unableToAccessError = new Error(
        `Unable to fetch history in channel`
      );
      unableToAccessError.type = "NO_HISTORY_ACCESS";
      unableToAccessError.channel = channel;
      throw unableToAccessError;
    }
  }
}

module.exports = { SlackGateway, SlackGatewayRoot };
