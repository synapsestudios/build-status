const core = require("@actions/core");
const { SlackMessage } = require("./src/SlackMessage");
const reportJobStatus = require("./src/reportJobStatus");
const sendFailureMessage = require("./src/sendFailureMessage");
const getActionParams = require("./src/getActionParams");

const execute = async function () {
  const params = await getActionParams();

  if (params.type === "update") {
    const slackMessage = new SlackMessage(params.token, {
      channel: params.channel,
      ts: params.messageTs,
    });

    await reportJobStatus(slackMessage)({
      runId: params.runId,
      job: params.job,
      status: params.jobStatus,
    });

    if (params.jobStatus === "failure") {
      await sendFailureMessage(params.token, params.header)(params.channel);
    }
  }
};

execute().catch((e) => core.setFailed(e.message));
