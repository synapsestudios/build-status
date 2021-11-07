const core = require('@actions/core');
const github = require('@actions/github');
const { SlackMessage } = require('./src/SlackMessage');
const reportJobStatus = require('./src/reportJobStatus');
const sendFailureMessage = require('./src/sendFailureMessage');

const execute = async function () {
  const slackMessage = new SlackMessage(core.getInput('token'), {
    channel: core.getInput('channel'),
    ts: core.getInput('messageTs'),
  });

  if (core.getInput('type') !== 'trigger') {
    await reportJobStatus(slackMessage)({
      runId: github.context.runId,
      job: core.getInput("name") || github.context.job,
      status: core.getInput('jobStatus'),
    });

    if (core.getInput('jobStatus') === 'failure') {
      await sendFailureMessage(core.getInput('token'))(core.getInput('channel'));
    }
  }
}

execute().catch((e) => core.setFailed(e.message));
