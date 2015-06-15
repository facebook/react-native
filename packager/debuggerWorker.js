
var messageHandlers = {
  'executeApplicationScript': function(message, sendReply) {
    for (var key in message.inject) {
      self[key] = JSON.parse(message.inject[key]);
    }
    loadScript(message.url, sendReply.bind(null, null));
  },
  'executeJSCall': function(message, sendReply) {
    var returnValue = [[], [], [], [], []];
    try {
      if (require) {
        returnValue = require(message.moduleName)[message.moduleMethod].apply(null, message.arguments);
      }
    } finally {
      sendReply(JSON.stringify(returnValue));
    }
  }
}

onmessage = function(message) {
  var object = message.data;

  var sendReply = function(result) {
     postMessage({replyID: object.id, result: result});
  }

  var handler = messageHandlers[object.method];
  if (handler) {
    handler(object, sendReply);
  } else {
    console.warn('Unknown method: ' + object.method);
  }
}

function loadScript(src, callback) {
  importScripts(src);
  callback();
}
