/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('babel-polyfill');

var fs = require('fs');
var path = require('path');

var _only = [];

function readBabelRC() {
  var rcpath = path.join(__dirname, 'react-packager', 'rn-babelrc.json');
  var source = fs.readFileSync(rcpath).toString();
  return JSON.parse(source);
}

module.exports = function(onlyList) {
  _only = _only.concat(onlyList);
  var config = readBabelRC();
  config.only = _only;
  require('babel-register')(config);
};
