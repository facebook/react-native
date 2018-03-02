/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

var _enabled = true;

function disable() {
  _enabled = false;
}

function log(stream, module) {
  return function() {
    if (!_enabled) {
      return;
    }
    const message = Array.prototype.slice.call(arguments).join(' ');
    stream.write(module + ': ' + message + '\n');
  };
}

module.exports.out = log.bind(null, process.stdout);
module.exports.err = log.bind(null, process.stderr);
module.exports.disable = disable;
