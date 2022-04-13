const core = require("@actions/core");
const github = require("@actions/github");

module.exports = async function getActionParams() {
  const githubToken = core.getInput("githubToken");
  const octokit = github.getOctokit(githubToken);
  const sender = github.context.payload.sender;
  const run = await octokit.rest.actions.getWorkflowRun({
    owner: github.context.payload.repository.owner.login,
    repo: github.context.payload.repository.name,
    run_id: github.context.runId,
  });

  return {
    runId: run.id,
    runUrl: run.data.html_url,
    senderName: sender.login,
    senderAvatar: sender.avatar_url,
    job: core.getInput("name") || github.context.job,
    header: core.getInput("header"),
    type: core.getInput("type"),
    channel: core.getInput("channel"),
    messageTs: core.getInput("messageTs"),
    token: core.getInput("token"),
    jobStatus: core.getInput("jobStatus"),
    link: core.getInput("link"),
    link_text: core.getInput("link_text"),
  };
};
