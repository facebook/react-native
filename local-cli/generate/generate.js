/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const parseCommandLine = require('../util/parseCommandLine');
const path = require('path');
const Promise = require('promise');
const yeoman = require('yeoman-environment');

/**
 * Generates the template for the given platform.
 */
function generate(argv, config) {
  return new Promise((resolve, reject) => {
    _generate(argv, config, resolve, reject);
  });
}

function _generate(argv, config, resolve, reject) {
  const args = parseCommandLine([{
    command: 'platform',
    description: 'Platform (ios|android)',
    type: 'string',
    required: true,
  },
  {
    command: 'project-path',
    description: 'Path to the project directory',
    type: 'string',
    required: true,
  },
  {
    command: 'project-name',
    description: 'Name of the project',
    type: 'string',
    required: true,
  }], argv);

  const oldCwd = process.cwd();
  process.chdir(args['project-path']);

  const env = yeoman.createEnv();
  env.register(path.join(__dirname, '../generator'), 'react:app');
  env.run(
    ['react:app', args['project-name']],
    {
      'skip-ios': args.platform !== 'ios',
      'skip-android': args.platform !== 'android'
    },
    () => {
      process.chdir(oldCwd);
      resolve();
    }
  );
}

module.exports = generate;
