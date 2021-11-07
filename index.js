const core = require('@actions/core');
const github = require('@actions/github');
const { SlackMessage } = require('./src/SlackMessage');
const initializeMessage = require('./src/initializeMessage');
const reportJobStatus = require('./src/reportJobStatus');

const execute = async function () {
  const octokit = github.getOctokit(core.getInput('githubToken'));
  const run = await octokit.rest.actions.getWorkflowRun({
    owner: github.context.payload.repository.owner.login,
    repo: github.context.payload.repository.name,
    run_id: github.context.runId,
  });

  const slackMessage = new SlackMessage(core.getInput('token'), {
    channel: core.getInput('channel'),
    ts: core.getInput('messageTs'),
  });

  if (core.getInput('type') === 'trigger') {
    const sender = github.context.payload.sender;
    const messageTs = await initializeMessage(slackMessage)(
      { name: sender.login, avatar: sender.avatar_url },
      run.data.html_url,
      core.getInput('header'),
    );
    core.setOutput('messageTs', messageTs);
  } else {
    await reportJobStatus(slackMessage)({
      runId: github.context.runId,
      job: core.getInput('name') || github.context.job,
      status: 'in_progress',
    });
  }
};

execute().catch((e) => core.setFailed(e.message));
