const { expect, use } = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { rest } = require("msw");
const { setupServer } = require("msw/node");

const waitForRequest = require("./waitForRequest");

const mockMessageResponse = require("./mockMessageResponse");
const mockHistoryResponse = require("./mockHistoryResponse");

const { SlackMessage, SlackMessageRoot } = require("../src/SlackMessage");
const SlackGateway = require("../src/SlackGateway.mock.js");

const server = setupServer();

use(chaiAsPromised);

describe("SlackMessage", () => {
  before(() => {
    server.listen();
  });
  after(() => {
    server.close();
  });

  it("is unable to instantiate base class", () => {
    expect(() => new SlackMessageRoot()).to.throw();
  });

  it("Throws when token is missing", async () => {
    expect(() => new SlackMessage()).to.throw();
  });

  it("Throws when initializing with no channel", async () => {
    const message = new SlackMessage("TOKEN");
    return expect(message.initialize()).to.be.rejected;
  });

  it("Sets .ts when initializing complete successfully", async () => {
    const mockMessage = mockMessageResponse();
    const gateway = new SlackGateway();
    gateway.getStub("sendNewMessage").returns(mockMessage);

    const message = new SlackMessage(gateway, { channel: "general" });
    await message.initialize({
      text: "I am a test message",
      attachments: [
        {
          text: "And here’s an attachment!",
        },
      ],
    });

    expect(message.ts).to.eq(mockMessage.ts);
  });

  it("allows me to inject a SlackGateway instance", () => {
    const gateway = new SlackGateway();
    new SlackMessage(gateway);
  });

  it("initialize responds predictably when there are errors in the slack response", async () => {
    const gateway = new SlackGateway();
    gateway.getStub("sendNewMessage").rejects(new Error("channel_not_found"));

    const message = new SlackMessage(gateway, {
      channel: "general",
    });

    return expect(message.initialize({})).to.be.rejectedWith(
      "channel_not_found"
    );
  });

  it("successfully appends a block", async () => {
    const gateway = new SlackGateway();

    gateway.getStub("fetchMessage").returns(mockHistoryResponse().messages[0]);
    gateway.getStub("updateMessage").returns(mockMessageResponse());

    const message = new SlackMessage(gateway, {
      channel: "C12345",
      ts: "1234.1234",
    });

    server.use(
      rest.get(
        "https://slack.com/api/conversations.history",
        (_req, res, ctx) => {
          return res(ctx.json(mockHistoryResponse()));
        }
      )
    );

    server.use(
      rest.post("https://slack.com/api/chat.update", (_req, res, ctx) => {
        return res(ctx.json(mockMessageResponse()));
      })
    );

    const newBlock = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":grey_exclamation:   api starting build",
      },
    };
    await message.sendBlock(newBlock);

    const updateStub = gateway.getStub("updateMessage");
    expect(updateStub.calledOnce).to.be.true;
    expect(updateStub.firstCall.args[0]).to.equal("C12345");
    expect(updateStub.firstCall.args[1]).to.equal("1234.1234");
    expect([...updateStub.firstCall.args[2].blocks].pop().text.text).to.equal(
      newBlock.text.text
    );
  });

  it("successfully overwrites a block", async () => {
    const message = new SlackMessage("TOKEN", {
      channel: "C12345",
      ts: "1234.1234",
    });

    const historyResponse = mockHistoryResponse();

    server.use(
      rest.get(
        "https://slack.com/api/conversations.history",
        (_req, res, ctx) => {
          return res(ctx.json(historyResponse));
        }
      )
    );

    const blockToOverwrite = historyResponse.messages[0].blocks[0];
    server.use(
      rest.post("https://slack.com/api/chat.update", (_req, res, ctx) => {
        const blocksMatchingId = _req.body.blocks.reduce(
          (blocks, b) =>
            b.block_id === blockToOverwrite.block_id ? [...blocks, b] : blocks,
          []
        );
        expect(blocksMatchingId.length).to.eq(1);
        expect(blocksMatchingId[0].type).to.eq("section");
        return res(ctx.json(mockMessageResponse()));
      })
    );

    await message.sendBlock({
      type: "section",
      block_id: blockToOverwrite.block_id,
      text: {
        type: "mrkdwn",
        text: ":grey_exclamation:   api starting build",
      },
    });
  });

  it("Sends a message to slack channel when bot does not have access to channel history", async () => {
    const message = new SlackMessage("TOKEN", {
      channel: "C12345",
      ts: "1234.1234",
    });

    server.use(
      rest.get(
        "https://slack.com/api/conversations.history",
        (_req, res, ctx) => {
          return res(ctx.status(422));
        }
      )
    );

    server.use(
      rest.post("https://slack.com/api/chat.postMessage", (_req, res, ctx) => {
        return res(ctx.json(mockMessageResponse()));
      })
    );

    const postEvents = waitForRequest(
      server,
      "POST",
      "https://slack.com/api/chat.postMessage"
    );

    await message.sendBlock({
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":grey_exclamation:   api starting build",
      },
    });

    const req = await postEvents;
    expect(req.body.blocks[0].text.text).to.equal(
      "The notification bot must be a member of this channel for build updates to work"
    );
  });

  describe("appendHeaderLink", () => {
    it("fails to append a header link when no link is supplied", async () => {
      const message = new SlackMessage("TOKEN", {
        channel: "C12345",
        ts: "1234.1234",
      });

      const result = message.appendHeaderLink();
      return expect(result).to.be.rejectedWith(Error, "link must be defined");
    });

    it("fails to append header link when link type is wrong", async () => {
      const message = new SlackMessage("TOKEN", {
        channel: "C12345",
        ts: "1234.1234",
      });

      const result = message.appendHeaderLink(20);
      return expect(result).to.be.rejectedWith(
        Error,
        "link must be a string or an object"
      );
    });

    it("fails to append header link when object is malformed", () => {
      const message = new SlackMessage("TOKEN", {
        channel: "C12345",
        ts: "1234.1234",
      });

      const result = message.appendHeaderLink({ invalid: "key" });
      return expect(result).to.be.rejectedWith(
        Error,
        "Object must contain 'url' and 'text' keys"
      );
    });

    it("Successfully sends a simple url", async () => {
      const message = new SlackMessage("TOKEN", {
        channel: "C12345",
        ts: "1234.1234",
      });

      server.use(
        rest.get(
          "https://slack.com/api/conversations.history",
          (_req, res, ctx) => {
            return res(ctx.json(mockHistoryResponse()));
          }
        )
      );

      server.use(
        rest.post("https://slack.com/api/chat.update", (_req, res, ctx) => {
          return res(ctx.json(mockMessageResponse()));
        })
      );

      const postEvents = waitForRequest(
        server,
        "POST",
        "https://slack.com/api/chat.update"
      );

      await message.appendHeaderLink("https://google.com");

      const response = await postEvents;
      expect(response.body.ts).to.equal("1234.1234");
      expect(response.body.channel).to.equal("C12345");
      expect(response.body.blocks[1].elements[1].text).to.have.string(
        "<https://google.com|https://google.com>"
      );
    });

    it("Successfully sends a link object", async () => {
      const message = new SlackMessage("TOKEN", {
        channel: "C12345",
        ts: "1234.1234",
      });

      server.use(
        rest.get(
          "https://slack.com/api/conversations.history",
          (_req, res, ctx) => {
            return res(ctx.json(mockHistoryResponse()));
          }
        )
      );

      server.use(
        rest.post("https://slack.com/api/chat.update", (_req, res, ctx) => {
          return res(ctx.json(mockMessageResponse()));
        })
      );

      const postEvents = waitForRequest(
        server,
        "POST",
        "https://slack.com/api/chat.update"
      );

      await message.appendHeaderLink({
        url: "https://google.com",
        text: "WOW COOL",
      });

      const response = await postEvents;
      expect(response.body.ts).to.equal("1234.1234");
      expect(response.body.channel).to.equal("C12345");
      expect(response.body.blocks[1].elements[1].text).to.have.string(
        "<https://google.com|WOW COOL>"
      );
    });
  });
});
