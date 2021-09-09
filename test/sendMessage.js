const { expect } = require('chai');
const { rest } = require("msw");
const { setupServer } = require('msw/node');

const sendMessage = require('../sendMessage');


const server = setupServer(
  rest.post('https://slack.com/api/chat.postMessage', (_req, res, ctx) => {
    return res(
      ctx.json({
	"ok": true,
	"channel": "C020D9LJZHT",
	"ts": "1619819948.002200",
	"message": {
	  "bot_id": "B02166AMVLY",
	  "type": "message",
	  "text": "New build in progress...",
	  "user": "U020NGWRPQC",
	  "ts": "1619819948.002200",
	  "team": "T020GJ44C5R",
	  "bot_profile": {
	    "id": "B02166AMVLY",
	    "deleted": false,
	    "name": "APPBOT",
	    "updated": 1619724180,
	    "app_id": "A021666TDR6",
	    "icons": {
	      "image_36": "https://a.slack-edge.com/80588/img/plugins/app/bot_36.png",
	      "image_48": "https://a.slack-edge.com/80588/img/plugins/app/bot_48.png",
	      "image_72": "https://a.slack-edge.com/80588/img/plugins/app/service_72.png"
	    },
	    "team_id": "T020GJ44C5R"
	  },
	  "blocks": [
	    {
	      "type": "header",
	      "block_id": "4nki",
	      "text": {
		"type": "plain_text",
		"text": "Build Update",
		"emoji": true
	      }
	    },
	    {
	      "type": "section",
	      "block_id": "nOlWJ",
	      "text": {
		"type": "mrkdwn",
		"text": ":large_yellow_circle: New build in progress...",
		"verbatim": false
	      }
	    }
	  ]
	},
	"warning": "missing_charset",
	"response_metadata": {
	  "warnings": [
	    "missing_charset"
	  ]
	}
      }),
    )
  }),
)

describe("sendMessage", () => {
  before(() => {
    server.listen()
  })
  after(() => {
    server.close()
  })

  it("Successfully sends a message", async () => {
    const messageTs = await sendMessage('TOKEN')('general');
    expect(messageTs).to.eq('1619819948.002200')
  })
});
