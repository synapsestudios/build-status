const { use, expect } = require("chai");
const chaiAsPromised = require("chai-as-promised");
use(chaiAsPromised);

const SlackMessage = require("../src/SlackMessage.mock");
const initializeMessage = require("../src/initializeMessage");

describe("initializeMessage", () => {
  it("Throws when you don't provide a SlackMessage", async () => {
    const result = initializeMessage()(
      {
        name: "spruce-bruce",
        avatar: "https://avatars.githubusercontent.com/u/59978?v=4",
      },
      "http://example.com"
    );

    return expect(result).to.be.rejected;
  });

  it("Throws when slack message isn't a SlackMessage instance", async () => {
    const result = initializeMessage({})(
      {
        name: "spruce-bruce",
        avatar: "https://avatars.githubusercontent.com/u/59978?v=4",
      },
      "http://example.com"
    );

    return expect(result).to.be.rejected;
  });

  it("Successfully returns a slack message timestamp", async () => {
    const slackMessage = new SlackMessage("1234.1234");
    const result = await initializeMessage(slackMessage)(
      {
        name: "spruce-bruce",
        avatar: "https://avatars.githubusercontent.com/u/59978?v=4",
      },
      "http://example.com"
    );

    expect(result).to.eq("1234.1234");
  });
});
