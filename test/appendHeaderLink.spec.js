const { use, expect } = require("chai");
const chaiAsPromised = require("chai-as-promised");
use(chaiAsPromised);

const SlackMessage = require("../src/SlackMessage.mock");
const appendHeaderLink = require("../src/appendHeaderLink");

describe("appendHeaderLink", () => {
  it("Throws when you don't provide a SlackMessage", async () => {
    const result = appendHeaderLink()("link");
    return expect(result).to.be.rejected;
  });

  it("Throws when slack message isn't a SlackMessage instance", async () => {
    const result = appendHeaderLink({})("link");
    return expect(result).to.be.rejected;
  });

  it("Sends link to slack and returns timestamp", async () => {
    const slackMessage = new SlackMessage("1234.1234");
    await appendHeaderLink(slackMessage)("https://www.google.com");

    const appendHeaderSpy = slackMessage.getSpy("appendHeaderLink");
    expect(appendHeaderSpy.calledOnce).to.be.true;
    expect(appendHeaderSpy.args[0][0]).to.equal("https://www.google.com");
  });

  it("fails when link is not provided", () => {
    const slackMessage = new SlackMessage("1234.1234");
    const result = appendHeaderLink(slackMessage)();
    return expect(result).to.be.rejected;
  });
});
