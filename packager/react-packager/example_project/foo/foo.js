/**
 * @providesModule foo
 */


var bar = require('bar');

class Logger {
  log() {
    console.log('youll have to change me lol');
  }
}

class SecretLogger extends Logger {
  log(secret) {
    console.log('logging ', secret);
  }
}

module.exports = (secret) => {
  if (secret !== 'secret') throw new Error('wrong secret');
  bar(new SecretLogger().log.bind(SecretLogger, secret), 400);
};
