/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('promise');
const yeoman = require('yeoman-environment');

module.exports = function upgrade(args, config) {
  args = args || process.argv;
  let env = yeoman.createEnv();
  let name = JSON.parse(fs.readFileSync('package.json', 'utf8')).name;
  let generatorPath = path.join(__dirname, '..', 'generator');
  env.register(generatorPath, 'react:app');
  let generatorArgs = ['react:app', name].concat(args);
  return new Promise((resolve) => env.run(generatorArgs, {upgrade: true}, resolve));
};
