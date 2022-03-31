const { SlackMessageRoot } = require("./SlackMessage");

module.exports =
  (slackMessage) =>
  async (ctx = { runId: "", job: "", status: "in_progress" }) => {
    if (!slackMessage) throw new Error("Slack Message object must be provided");
    if (!(slackMessage instanceof SlackMessageRoot))
      throw new Error("slackMessage must be SlackMessage object");

    const id = `${ctx.job}_${ctx.runId}`;
    await slackMessage.sendBlock(getBlockObject(id, ctx.status, ctx.job));
  };

const getBlockObject = (id, status, job) => ({
  type: "section",
  block_id: id,
  text: {
    type: "mrkdwn",
    text: `${emojiMap[status]} ${job} ${messageMap[status]}`,
  },
});

const messageMap = {
  in_progress: "in progress...",
  success: "succeeded!",
  failure: "FAILED!",
};

const emojiMap = {
  in_progress: ":large_yellow_circle:",
  success: ":large_green_circle:",
  failure: ":red_circle:",
};
