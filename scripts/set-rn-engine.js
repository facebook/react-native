/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script updates the engine used by React Native
 */
const {echo, exec, exit, sed} = require('shelljs');
const yargs = require('yargs');

let argv = yargs.option('e', {
  alias: 'engine',
  describe: 'Choose an engine',
  type: 'string',
  choices: ['hermes', 'jsc'],
}).argv;

const engine = argv.engine;

if (!engine) {
  echo('You must specify an engine using -e');
  exit(1);
}

// Change the template build.gradle
sed(
  '-i',
  /enableHermes:.*/,
  engine === 'jsc' ? 'enableHermes: false' : 'enableHermes: true',
  'template/android/app/build.gradle',
);

// Validate the hermes flag has been changed properly
const hermes =
  exec(
    'grep enableHermes: template/android/app/build.gradle | awk \'{split($0,a,"[:,]"); print a[2]}\'',
    {silent: true},
  ).stdout.trim() === 'true';

if ((engine === 'jsc' && hermes) || (engine === 'hermes' && !hermes)) {
  echo('Failed to update the engine in template/android/app/build.gradle');
  echo('Fix the issue and try again');
  exit(1);
}

exit(0);
