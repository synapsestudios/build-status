const core = require("@actions/core");
const { SlackMessage } = require("./src/SlackMessage");
const initializeMessage = require("./src/initializeMessage");
const reportJobStatus = require("./src/reportJobStatus");
const getActionParams = require("./src/getActionParams");

const actionMap = {
  trigger: async (params) => {
    const messageTs = await initializeMessage(slackMessage)(
      { name: params.senderName, avatar: params.senderAvatar },
      params.runUrl,
      params.header
    );
    core.setOutput("messageTs", messageTs);
  },
};

const execute = async function () {
  const params = await getActionParams();

  const slackMessage = new SlackMessage(params.token, {
    channel: params.channel,
    ts: params.messageTs,
  });

  if (params.type === "trigger") {
    await actionMap.trigger(params);
    // const messageTs = await initializeMessage(slackMessage)(
    //   { name: params.senderName, avatar: params.senderAvatar },
    //   params.runUrl,
    //   params.header
    // );
    // core.setOutput("messageTs", messageTs);
  } else {
    await reportJobStatus(slackMessage)({
      job: params.job,
      runId: params.runId,
      status: "in_progress",
    });
  }
};

execute().catch((e) => core.setFailed(e.message));
