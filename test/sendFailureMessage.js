const { expect } = require("chai");
const sendFailureMessage = require("../src/sendFailureMessage");
const { rest } = require("msw");
const { setupServer } = require("msw/node");
const mockMessageResponse = require("./mockMessageResponse");

const server = setupServer();

describe("sendFailureMessage", () => {
  before(() => {
    server.listen();
  });
  after(() => {
    server.close();
  });

  it("sends a build failure message", async () => {
    const mockedResponse = mockMessageResponse();
    server.use(
      rest.post("https://slack.com/api/chat.postMessage", (_req, res, ctx) => {
        return res(ctx.json(mockMessageResponse()));
      })
    );

    // server.use(
    //   rest.post("https://slack.com/api/chat.update", (_req, res, ctx) =>
    //     res(ctx.json(mockedResponse))
    //   )
    // );

    const messageTs = await sendFailureMessage("TOKEN")("C020D9LJZHT");
    expect(messageTs).to.eq(mockedResponse.message.ts);
  });
});
