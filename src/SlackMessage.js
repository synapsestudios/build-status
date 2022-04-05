const got = require("got");
const SlackGateway = require("./SlackGateway");

class SlackMessageRoot {
  constructor() {
    if (new.target === SlackMessageRoot) {
      throw new TypeError("Cannot construct Abstract instances directly");
    }
  }

  get ts() {
    return;
  }

  async initialize() {
    return;
  }

  async sendBlock() {
    return;
  }
}

class SlackMessage extends SlackMessageRoot {
  #_channel = "";
  #_ts = "";
  #_slackGateway;

  constructor(slackToken, message = { channel: "", ts: "" }) {
    super();
    this.#_slackGateway = new SlackGateway(slackToken);
    this.#_channel = message.channel;
    this.#_ts = message.ts;
  }

  async _postRequest(method, body) {
    const response = await got.post(`https://slack.com/api/${method}`, {
      headers: {
        Authorization: `Bearer ${this.#_slackGateway.getToken()}`,
      },
      json: body,
      responseType: "json",
    });
    if (!response.body.ok) throw new Error(response.body.error);
    return response.body;
  }

  async initialize(message) {
    if (!this.#_channel) throw new Error("channel is required");
    const response = await this.#_slackGateway.sendNewMessage(
      this.#_channel,
      message
    );
    this.#_ts = response.message.ts;
  }

  async sendBlock(block) {
    if (!this.#_channel) throw new Error("Channel is required");
    if (!this.#_ts) throw new Error("ts is required");

    let response;
    try {
      response = await this.#_slackGateway.fetchMessage(
        this.#_channel,
        this.#_ts
      );

      if (response.body.ok) {
        const message = response.body.messages[0];

        await this.#_slackGateway.updateMessage(this.#_channel, this.#_ts, {
          text: message.text,
          blocks: overwriteOrAppendBlock(message.blocks),
        });
      }
    } catch (e) {
      if (e.type === "NO_HISTORY_ACCESS") {
        await this._postRequest("chat.postMessage", {
          channel: this.#_channel,
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: "The notification bot must be a member of this channel for build updates to work",
              },
            },
          ],
        });
      } else {
        throw e;
      }
    }

    function overwriteOrAppendBlock(messageBlocks) {
      let blocks = [...messageBlocks];
      const blockIdx = blocks.findIndex((b) => b.block_id === block.block_id);
      if (blockIdx >= 0) {
        blocks[blockIdx] = block;
      } else {
        blocks = [...blocks, block];
      }
      return blocks;
    }
  }

  get ts() {
    return this.#_ts;
  }
}

module.exports = { SlackMessage, SlackMessageRoot };
