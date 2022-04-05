const { expect, use } = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { rest } = require("msw");
const { setupServer } = require("msw/node");

const waitForRequest = require("./waitForRequest");

const mockMessageResponse = require("./mockMessageResponse");
const mockHistoryResponse = require("./mockHistoryResponse");
const mockMessageFailure = () => ({
  ok: false,
  error: "channel_not_found",
  warning: "missing_charset",
  response_metadata: { warnings: ["missing_charset"] },
});

const { SlackMessage, SlackMessageRoot } = require("../src/SlackMessage");

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
    expect(() => new SlackMessageRoot()).to.throw;
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
    server.use(
      rest.post("https://slack.com/api/chat.postMessage", (_req, res, ctx) =>
        res(ctx.json(mockMessage))
      )
    );

    const message = new SlackMessage("TOKEN", { channel: "general" });
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

  it("initialize responds predictably when there are errors in the slack response", async () => {
    const mockFailure = mockMessageFailure();
    server.use(
      rest.post("https://slack.com/api/chat.postMessage", (_req, res, ctx) => {
        return res(ctx.json(mockFailure));
      })
    );

    const message = new SlackMessage("TOKEN", { channel: "general" });
    expect(message.initialize({})).to.be.rejected;
  });

  it("successfully appends a block", async () => {
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

    await message.sendBlock({
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":grey_exclamation:   api starting build",
      },
    });

    await postEvents;
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

    await postEvents;
  });
});
