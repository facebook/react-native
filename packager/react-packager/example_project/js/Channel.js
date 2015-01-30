/**
 * @providesModule Channel
 */

var XHR = require('XHR');

/**
 * Client implementation of a server-push channel.
 *
 * @see Channel.js for full documentation
 */
var channel = null, at = null, delay = 0;
var Channel = {};

Channel.connect = function() {
  var url = '/pull';
  if (channel) {
    url += '?channel=' + channel + '&at=' + at;
  }
  XHR.get(url, function(err, xhr) {
    if (err) {
      delay = Math.min(Math.max(1000, delay * 2), 30000);
    } else {
      var res = xhr.responseText;
      res = JSON.parse(res);

      delay = 0;

      // Cache channel state
      channel = res.channel;
      at = res.at;

      var messages = res.messages;
      messages.forEach(function(message) {
        var ev = document.createEvent('CustomEvent');
        ev.initCustomEvent(message.event, true, true, message.detail);
        window.dispatchEvent(ev);
      });
    }

    // Reconnect
    setTimeout(Channel.connect, delay);
  });
};

module.exports = Channel;
