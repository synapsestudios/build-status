const { SlackMessageRoot } = require("./SlackMessage");

module.exports = (slackMessage) => async (
  sender = { name: "string", avatar: "" },
  workflowLink = ""
) => {
  if (!slackMessage) throw new Error("Slack Message object must be provided");
  if (!(slackMessage instanceof SlackMessageRoot))
    throw new Error("slackMessage must be SlackMessage object");

  await slackMessage.initialize(constructMessage(sender, workflowLink));
  return slackMessage.ts;
};

function constructMessage(sender, workflowLink) {
  return {
    text: ":construction: Build Triggered :construction: ",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":construction: Build Triggered :construction: ",
          emoji: true,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url: sender.avatar,
            alt_text: sender.name,
          },
          {
            type: "mrkdwn",
            text: `*${sender.name}* has triggered a build.\n<${workflowLink}|Watch Progress>`,
          },
        ],
      },
      {
        type: "divider",
      },
    ],
  };
}
