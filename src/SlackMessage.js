const got = require("got");
const { SlackGateway } = require("./SlackGateway");

class SlackMessageRoot {
  constructor() {
    if (new.target === SlackMessageRoot) {
      throw new TypeError("Cannot construct Abstract instances directly");
    }
  }

  get ts() {
    return;
  }

  async appendHeaderLink() {
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

  async #sendNoAccessMessage() {
    const noAccessMessage = {
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "The notification bot must be a member of this channel for build updates to work",
          },
        },
      ],
    };
    await this.#_slackGateway.sendNewMessage(this.#_channel, noAccessMessage);
  }

  async initialize(message) {
    if (!this.#_channel) throw new Error("channel is required");
    const response = await this.#_slackGateway.sendNewMessage(
      this.#_channel,
      message
    );
    this.#_ts = response.message.ts;
  }

  async appendHeaderLink(link) {
    if (!link) throw new Error("link must be defined");
    if (typeof link !== "string" && typeof link !== "object")
      throw new Error("link must be a string or an object");

    let linkObj;
    if (typeof link === "object") {
      if (!link.text || !link.url)
        throw new Error("Object must contain 'url' and 'text' keys");
      linkObj = { ...link };
    } else {
      linkObj = { url: link, text: link };
    }

    const response = await this.#_slackGateway.fetchMessage(
      this.#_channel,
      this.#_ts
    );

    if (response.body.ok) {
      const message = response.body.messages[0];
      const bylineBlock = message.blocks[1];

      const newBylineBlock = {
        ...bylineBlock,
        elements: [...bylineBlock.elements],
      };
      newBylineBlock.elements[1].text = `${newBylineBlock.elements[1].text} | <${linkObj.url}|${linkObj.text}>`;

      this.#_slackGateway.updateMessage(this.#_channel, this.#_ts, {
        text: message.text,
        blocks: overwriteOrAppendBlock(newBylineBlock, message.blocks),
      });
    }

    function overwriteOrAppendBlock(block, messageBlocks) {
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
        await this.#sendNoAccessMessage();
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
