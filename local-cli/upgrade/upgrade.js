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
const chalk = require('chalk');
const path = require('path');
const Promise = require('promise');
const yeoman = require('yeoman-environment');
const semver = require('semver');

module.exports = function upgrade(args, config) {
  args = args || process.argv;
  const env = yeoman.createEnv();
  const pak = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pak.dependencies['react-native'];

  if (version) {
    if (version === 'latest' || version === '*') {
      console.warn(
        chalk.yellow(
          'Major releases are most likely to introduce breaking changes.\n' +
          'Use a proper version number in your \'package.json\' file to avoid breakage.\n' +
          'e.g. - ^0.18.0'
        )
      );
    } else {
      const installed = JSON.parse(fs.readFileSync('node_modules/react-native/package.json', 'utf8'));

      if (semver.satisfies(installed.version, version)) {
        const v = version.replace(/^(~|\^|=)/, '').replace(/x/i, '0');

        if (semver.valid(v)) {
          console.log(
            'Upgrading project to react-native v' + installed.version + '\n' +
            'Be sure to read the release notes and breaking changes:\n' +
            chalk.blue(
              'https://github.com/facebook/react-native/releases/tag/v' + semver.major(v) + '.' + semver.minor(v) + '.0'
            )
          );

          // >= v0.21.0, we require react to be a peer dependency
          if (semver.gte(v, '0.21.0') && !pak.dependencies['react']) {
            console.log(
              chalk.yellow(
                '\nYour \'package.json\' file doesn\'t seem to have \'react\' as a dependency.\n' +
                '\'react\' was changed from a dependency to a peer dependency in react-native v0.21.0.\n' +
                'Therefore, it\'s necessary to include \'react\' in your project\'s dependencies.\n' +
                'Just run \'npm install --save react\', then re-run \'react-native upgrade\'.\n'
              )
            );
            return Promise.resolve();
          }
          
          if (semver.satisfies(v, '~0.26.0')) {
            console.log(
              chalk.yellow(
                'React Native 0.26 introduced some breaking changes to the native files on iOS. You can\n' +
                'perform them manually by checking the release notes or use \'rnpm\' to do it automatically.\n' +
                'Just run:\n' +
                '\'npm install -g rnpm && npm install rnpm-plugin-upgrade@0.26 --save-dev\', then run \'rnpm upgrade\''
              )
            );
          }
        } else {
          console.log(
            chalk.yellow(
              'A valid version number for \'react-native\' is not specified in your \'package.json\' file.'
            )
          );
        }
      } else {
        console.warn(
          chalk.yellow(
            'react-native version in \'package.json\' doesn\'t match the installed version in \'node_modules\'.\n' +
            'Try running \'npm install\' to fix the issue.'
          )
        );
      }
    }
  } else {
    console.warn(
      chalk.yellow(
        'Your \'package.json\' file doesn\'t seem to have \'react-native\' as a dependency.'
      )
    );
  }

  const generatorPath = path.join(__dirname, '..', 'generator');
  env.register(generatorPath, 'react:app');
  const generatorArgs = ['react:app', pak.name].concat(args);
  return new Promise((resolve) => env.run(generatorArgs, {upgrade: true}, resolve));
};
