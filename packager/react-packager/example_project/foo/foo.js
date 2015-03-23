/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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
