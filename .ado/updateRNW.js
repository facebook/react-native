// @ts-check
// This will trigger the evergreen build in the react-native-windows repo to update to the latest build of react-native

const request = require('request');

const url =
  'https://api.github.com/repos/microsoft/react-native-windows/dispatches';
request.post(
  {
    url: url,
    json: true,
    headers: {
      Authorization: 'Basic ' + new Buffer(":" + process.env.GIT_TOKEN).toString("base64"),
      'Content-Type': 'application/json',
      'User-Agent': 'RNW-Evergreen Script',
      Accept: 'application/vnd.github.everest-preview+json',
    },
    body: {
      event_type: 'evergreen',
    },
  },
  function(err, httpResponse, _body) {
    if (err) {
      throw new Error(err);
    }

    if (httpResponse.statusCode != 204) {
      throw new Error('Failed to trigger build.');
    }
  },
);
