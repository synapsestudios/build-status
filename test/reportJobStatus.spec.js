const { use, expect } = require("chai");
const chaiAsPromised = require("chai-as-promised");
use(chaiAsPromised);

const reportJobStatus = require("../src/reportJobStatus");
const SlackMessage = require("../src/SlackMessage.mock");

describe("reportJobStatus", () => {
  it("reports status", async () => {
    const message = new SlackMessage("1234.1234");
    await reportJobStatus(message)({
      runId: "123",
      job: "AJOB",
      status: "in_progress",
    });

    expect(message.getSpy("appendBlock").calledOnce).to.be.true;

    const block = message.getSpy("appendBlock").args[0][0];
    expect(block.block_id).to.eq("AJOB_123");
  });

  it("Throws when you don't provide a SlackMessage", async () => {
    const result = reportJobStatus()();
    return expect(result).to.be.rejected;
  });

  it("Throws when slack message isn't a SlackMessage instance", async () => {
    const result = reportJobStatus({})();
    return expect(result).to.be.rejected;
  });
});
