const got = require("got");

module.exports = (token, header) => async (channel) => {
  const response = await got.post("https://slack.com/api/chat.postMessage", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: {
      ...getMessageObject({
        text: `${header} IS FAILING\n:policesiren::policesiren::policesiren::policesiren:`,
        emoji: ":policesiren::policesiren::policesiren::policesiren:\n",
      }),
      channel: channel,
    },
    responseType: "json",
  });

  return response.body.message.ts;
};

const getMessageObject = ({ emoji, text }) => ({
  text: text,
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Build Update",
        emoji: true,
      },
    },
    {
      type: "section",
      block_id: "api",
      text: {
        type: "mrkdwn",
        text: `${emoji} ${text}`,
      },
    },
  ],
});
