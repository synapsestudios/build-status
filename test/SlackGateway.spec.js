const chai = require("chai");
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
const { SlackGateway, SlackGatewayRoot } = require("../src/SlackGateway");

const server = setupServer();

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("SlackGateway", () => {
  before(() => {
    server.listen();
  });
  after(() => {
    server.close();
  });

  it("is unable to instantiate base class", () => {
    expect(() => new SlackGatewayRoot()).to.throw();
  });

  it("Throws when token is missing", async () => {
    expect(() => new SlackGateway()).to.throw();
  });

  it("initializes successfully when slack token is provided", () => {
    new SlackGateway("TOKEN");
  });

  describe("sendNewMessage", async () => {
    it("throws when channel isn't provided", () => {
      const gateway = new SlackGateway("TOKEN");
      return expect(gateway.sendNewMessage()).to.be.rejectedWith(
        "channel is required"
      );
    });

    it("throws when message is not provided", () => {
      const gateway = new SlackGateway("TOKEN");
      return expect(gateway.sendNewMessage("channel")).to.be.rejectedWith(
        "message is required"
      );
    });

    it("throws when message isn't an object", () => {
      const gateway = new SlackGateway("TOKEN");
      return expect(
        gateway.sendNewMessage("channel", "message")
      ).to.be.rejectedWith("message is not an object");
    });

    it("Sends a message to slack using their api", async () => {
      const mockMessage = mockMessageResponse();
      server.use(
        rest.post("https://slack.com/api/chat.postMessage", (_req, res, ctx) =>
          res(ctx.json(mockMessage))
        )
      );
      const postEvents = waitForRequest(
        server,
        "POST",
        "https://slack.com/api/chat.postMessage"
      );

      const gateway = new SlackGateway("TOKEN");
      const response = await gateway.sendNewMessage("channel", {
        text: "some text goes here",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `:construction: BUILD :construction: `,
              emoji: true,
            },
          },
        ],
      });

      expect(response.ts).to.equal(mockMessage.ts);

      const req = await postEvents;
      expect(req.body.text).to.equal("some text goes here");
      expect(req.body.channel).to.equal("channel");
    });
  });

  describe("updateMessage", () => {});

  describe("fetchMessage", () => {});
});
