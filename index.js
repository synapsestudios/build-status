const core = require("@actions/core");
const { SlackMessage } = require("./src/SlackMessage");
const initializeMessage = require("./src/initializeMessage");
const reportJobStatus = require("./src/reportJobStatus");
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
};

const execute = async function () {
  const params = await getActionParams();

  const slackMessage = new SlackMessage(params.token, {
    channel: params.channel,
    ts: params.messageTs,
  });

  if (params.type === "trigger") {
    await useCaseMap.trigger(slackMessage, params);
  } else {
    await useCaseMap.update(slackMessage, params);
  }
};

execute().catch((e) => core.setFailed(e.message));
