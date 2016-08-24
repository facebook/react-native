/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var generate = require('../generate/generate');
var fs = require('fs');

function android(argv, config, args) {
  return generate([
    '--platform', 'android',
    '--project-path', process.cwd(),
    '--project-name', args.projectName,
  ], config);
}

module.exports = {
  name: 'android',
  description: 'creates an empty android project',
  func: android,
  options: [{
    command: '--project-name [name]',
    default: () => JSON.parse(
      fs.readFileSync('package.json', 'utf8')
    ).name,
  }],
};
