const { SlackMessageRoot } = require("./SlackMessage");

module.exports = (slackMessage) => async (link) => {
  if (!slackMessage) throw new Error("Slack Message object must be provided");
  if (!(slackMessage instanceof SlackMessageRoot))
    throw new Error("slackMessage must be SlackMessage object");
  if (!link) throw new Error("link must be provided");

  await slackMessage.appendHeaderLink(link);
  return slackMessage.ts;
};
