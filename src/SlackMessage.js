const got = require('got');

class SlackMessageRoot {
  constructor() {
    if (new.target === SlackMessageRoot) {
      throw new TypeError('Cannot construct Abstract instances directly');
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
  #_token = '';
  #_channel = '';
  #_ts = '';

  constructor(token, message = { channel: '', ts: '' }) {
    super();
    if (!token) throw new Error('token is required');
    this.#_token = token;
    this.#_channel = message.channel;
    this.#_ts = message.ts;
  }

  async _postRequest(method, body) {
    const response = await got.post(`https://slack.com/api/${method}`, {
      headers: {
        Authorization: `Bearer ${this.#_token}`,
      },
      json: body,
      responseType: 'json',
    });

    if (!response.body.ok) throw new Error(response.body.error);
    return response.body;
  }

  async initialize(message) {
    if (!this.#_channel) throw new Error('channel is required');
    const response = await this._postRequest('chat.postMessage', {
      ...message,
      channel: this.#_channel,
    });
    this.#_ts = response.message.ts;
  }

  async sendBlock(block) {
    if (!this.#_channel) throw new Error('Channel is required');
    if (!this.#_ts) throw new Error('ts is required');

    const historySearchParams = new URLSearchParams();
    historySearchParams.append('channel', this.#_channel);
    historySearchParams.append('latest', this.#_ts);
    historySearchParams.append('limit', 1);
    historySearchParams.append('inclusive', 'true');

    const response = await got.get(`https://slack.com/api/conversations.history?${historySearchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.#_token}`,
      },
      responseType: 'json',
    });

    if (response.body.ok) {
      const message = response.body.messages[0];

      await this._postRequest('chat.update', {
        text: message.text,
        channel: this.#_channel,
        ts: this.#_ts,
        blocks: overwriteOrAppendBlock(message.blocks),
      });
    } else {
      await this._postRequest('chat.postMessage', {
        channel: this.#_channel,
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: 'The notification bot must be a member of this channel for build updates to work',
            },
          },
        ],
      });
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
