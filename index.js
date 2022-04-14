const core = require("@actions/core");
const { SlackMessage } = require("./src/SlackMessage");
const { SlackGateway } = require("./src/SlackMessage");
const initializeMessage = require("./src/initializeMessage");
const reportJobStatus = require("./src/reportJobStatus");
const appendHeaderLink = require("./src/appendHeaderLink");
const getActionParams = require("./src/getActionParams");

const useCaseMap = {
  trigger: async (slackMessage, params) => {
    const messageTs = await initializeMessage(slackMessage)(
      { name: params.senderName, avatar: params.senderAvatar },
      params.runUrl,
      params.header
    );
    core.setOutput("messageTs", messageTs);
  },
  update: async (slackMessage, params) => {
    await reportJobStatus(slackMessage)({
      job: params.job,
      runId: params.runId,
      status: "in_progress",
    });
  },
  link: async (slackMessage, params) => {
    await appendHeaderLink(slackMessage)({
      url: params.link,
      text: params.link_text,
    });
  },
};

const execute = async function () {
  const params = await getActionParams();

  const slackGateway = new SlackGateway(params.token);
  const slackMessage = new SlackMessage(slackGateway, {
    channel: params.channel,
    ts: params.messageTs,
  });

  if (!useCaseMap[params.type])
    throw new Error(
      `type can be "trigger" or "update". You provided "${params.type}"`
    );

  await useCaseMap[params.type](slackMessage, params);
};

execute().catch((e) => core.setFailed(e.message));
