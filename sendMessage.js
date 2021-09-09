const got = require('got');

const getMessageJson = (text) => ({
  "text": text,
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Build Update",
        "emoji": true
      },
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `:large_yellow_circle: ${text}`
      },
    },
  ],
});

module.exports = (token) => async (channel) => {
	const response = await got.post('https://slack.com/api/chat.postMessage', {
		headers: {
			Authorization: `Bearer ${token}`
		},
		json: { ...getMessageJson('New build in progress...'), channel },
		responseType: 'json'
	});

	return response.body.ts;
}
