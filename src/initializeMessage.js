const { SlackMessageRoot } = require("./SlackMessage");

module.exports =
  (slackMessage) =>
  async (
    sender = { name: "string", avatar: "" },
    workflowLink = "",
    header = "Build"
  ) => {
    if (!slackMessage) throw new Error("Slack Message object must be provided");
    if (!(slackMessage instanceof SlackMessageRoot))
      throw new Error("slackMessage must be SlackMessage object");

    await slackMessage.initialize(
      constructMessage(sender, workflowLink, header)
    );
    return slackMessage.ts;
  };

function constructMessage(sender, workflowLink, header) {
  return {
    text: `:construction: ${header} :construction: `,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `:construction: ${header} :construction: `,
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
            text: `*${sender.name}* has triggered an action.\n<${workflowLink}|Watch Progress>`,
          },
        ],
      },
      {
        type: "divider",
      },
    ],
  };
}
