/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var utils = require('../generator-utils');

module.exports = yeoman.generators.NamedBase.extend({
  constructor: function() {
    yeoman.generators.NamedBase.apply(this, arguments);
    this.option('skip-ios', {
      desc: 'Skip generating iOS files',
      type: Boolean,
      defaults: false
    });
    this.option('skip-android', {
      desc: 'Skip generating Android files',
      type: Boolean,
      defaults: false
    });
    this.option('skip-jest', {
      desc: 'Skip installing Jest',
      type: Boolean,
      defaults: false
    });
    this.option('upgrade', {
      desc: 'Specify an upgrade',
      type: Boolean,
      defaults: false
    });

    // this passes command line arguments down to the composed generators
    var args = {args: arguments[0], options: this.options};
    if (!this.options['skip-ios']) {
      this.composeWith('react:ios', args, {
        local: require.resolve(path.resolve(__dirname, '..', 'generator-ios'))
      });
    }
    if (!this.options['skip-android']) {
      this.composeWith('react:android', args, {
        local: require.resolve(path.resolve(__dirname, '..', 'generator-android'))
      });
    }
  },

  configuring: function() {
    utils.copyAndReplace(
      this.templatePath('../../../.flowconfig'),
      this.destinationPath('.flowconfig'),
      {
        'Libraries\/react-native\/react-native-interface.js' : 'node_modules/react-native/Libraries/react-native/react-native-interface.js',
        '^flow/$' : 'node_modules/react-native/flow\nflow/'
      }
    );

    this.fs.copy(
      this.templatePath('_gitignore'),
      this.destinationPath('.gitignore')
    );
    this.fs.copy(
      this.templatePath('_watchmanconfig'),
      this.destinationPath('.watchmanconfig')
    );
    this.fs.copy(
      this.templatePath('_buckconfig'),
      this.destinationPath('.buckconfig')
    );
  },

  writing: function() {
    if (this.options.upgrade) {
      // never upgrade index.*.js files
      return;
    }
    if (!this.options['skip-ios']) {
      this.fs.copyTpl(
        this.templatePath('index.ios.js'),
        this.destinationPath('index.ios.js'),
        {name: this.name}
      );
    }
    if (!this.options['skip-android']) {
      this.fs.copyTpl(
        this.templatePath('index.android.js'),
        this.destinationPath('index.android.js'),
        {name: this.name}
      );
    }
  },

  install: function() {
    if (this.options.upgrade) {
      return;
    }

    var reactNativePackageJson = require('../../package.json');
    var { peerDependencies } = reactNativePackageJson;
    if (!peerDependencies) {
      return;
    }

    var reactVersion = peerDependencies.react;
    if (!reactVersion) {
      return;
    }

    this.npmInstall(`react@${reactVersion}`, { '--save': true, '--save-exact': true });
    if (!this.options['skip-jest']) {
      this.npmInstall(`jest babel-jest jest-react-native babel-preset-react-native react-test-renderer@${reactVersion}`.split(' '), {
        saveDev: true,
        '--save-exact': true
      });
      fs.writeFileSync(
        path.join(
          this.destinationRoot(),
          '.babelrc'
        ),
        '{\n"presets": ["react-native"]\n}'
      );

      this.fs.copy(
        this.templatePath('__tests__'),
        this.destinationPath('__tests__'),
        {
          nodir: false
        }
      );

      var packageJSONPath = path.join(
        this.destinationRoot(),
        'package.json'
      );
      var packageJSON = JSON.parse(
        fs.readFileSync(
          packageJSONPath
        )
      );
      packageJSON.scripts.test = 'jest';
      packageJSON.jest = {
        preset: 'jest-react-native'
      };
      fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, '\t'));
    }
  }
});
