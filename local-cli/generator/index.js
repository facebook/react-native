/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var execSync = require('child_process').execSync;
var fs = require('fs');
var path = require('path');
var semver = require('semver')
var utils = require('../generator-utils');
var yeoman = require('yeoman-generator');

// Use Yarn if available, it's much faster than the npm client.
// Return the version of yarn installed on the system, null if yarn is not available.
function getYarnVersionIfAvailable() {
  let yarnVersion;
  try {
    // execSync returns a Buffer -> convert to string
    if (process.platform.startsWith('win')) {
      yarnVersion = (execSync('yarn --version').toString() || '').trim();
    } else {
      yarnVersion = (execSync('yarn --version 2>/dev/null').toString() || '').trim();
    }
  } catch (error) {
    return null;
  }
  // yarn < 0.16 has a 'missing manifest' bug
  try {
    if (semver.gte(yarnVersion, '0.16.0')) {
      return yarnVersion;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Cannot parse yarn version: ' + yarnVersion);
    return null;
  }
}

/**
 * Check that 'react-native init' itself used yarn to install React Native.
 * When using an old global react-native-cli@1.0.0 (or older), we don't want
 * to install React Native with npm, and React + Jest with yarn.
 * Let's be safe and not mix yarn and npm in a single project.
 * @param projectDir e.g. /Users/martin/AwesomeApp
 */
function isGlobalCliUsingYarn(projectDir) {
  return fs.existsSync(path.join(projectDir, 'yarn.lock'));
}

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
    // Temporary option until yarn becomes stable.
    this.option('npm', {
      desc: 'Use the npm client, even if yarn is available.',
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

    const yarnVersion = (!this.options['npm']) && getYarnVersionIfAvailable() && isGlobalCliUsingYarn(this.destinationRoot());

    console.log('Installing React...');
    if (yarnVersion) {
      execSync(`yarn add react@${reactVersion}`);
    } else {
      this.npmInstall(`react@${reactVersion}`, { '--save': true, '--save-exact': true });
    }
    if (!this.options['skip-jest']) {
      console.log('Installing Jest...');
      if (yarnVersion) {
        execSync(`yarn add jest babel-jest jest-react-native babel-preset-react-native react-test-renderer@${reactVersion} --dev --exact`);
      } else {
        this.npmInstall(`jest babel-jest babel-preset-react-native react-test-renderer@${reactVersion}`.split(' '), {
          saveDev: true,
          '--save-exact': true
        });
      }
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
        preset: 'react-native'
      };
      fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, '\t'));
    }
  }
});
