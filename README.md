# Build Status

Yet another action to notify slack of the status of jobs. This action creates a single message in slack for a workflow run and updates that message with the status of each job as it starts, succeeds or fails. It ends up looking kinda like this:

![Build Status Notification](doc/message_screenshot.png?raw=true "Build Status Notification")

## Usage

Because we create and update a single slack message you need to initialize the message in slack first. I usually do that in a step by itself at the beginning of a workflow like so:

```
  Initialize_Slack_Message:
    name: Initialize Test Notification
    runs-on: "ubuntu-latest"
    outputs:
      messageTs: ${{ steps.notification.outputs.messageTs }}   # We need to keep the messageTs and pass it into future invocations of build-status
    steps:
      - name: Set up notifications
        id: notification
        uses: synapsestudios/build-status@main
        with:
          type: "trigger"
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          token: ${{ secrets.SLACK_API_TOKEN }}
          channel: "C020D9LJZHT"
          header: Build ${{ github.run_number }}
```

### Sending Job Status

```
  Test:
    name: Run Unit Tests
    runs-on: "ubuntu-latest"
    needs: [Initialize_Slack_Message]
    steps:
      - name: Notify Job Status
        uses: synapsestudios/build-status@main
        with:
          messageTs: ${{ needs.Initialize_Slack_Message.outputs.messageTs }}   # Pull the messageTs from the initialization step
          jobStatus: ${{ job.status }}                                         # Pass in job.status
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          token: ${{ secrets.SLACK_API_TOKEN }}
          channel: "C020D9LJZHT"
          name: Test Job

      - uses: actions/checkout@v2
		  - name: run tests
			  run: npm i && npm test
```

### Appending a Link to the Header

```
      - name: Append Header Link!
        uses: synapsestudios/build-status@main
        with:
          type: "link"
          messageTs: ${{ needs.Initialize_Slack_Message.outputs.messageTs }}
          jobStatus: ${{ job.status }}
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          token: ${{ secrets.SLACK_API_TOKEN }}
          channel: "C020D9LJZHT"
          link: "http://www.google.com"
```
