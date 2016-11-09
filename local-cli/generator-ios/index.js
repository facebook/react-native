/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var chalk = require('chalk');
var path = require('path');
var yeoman = require('yeoman-generator');

module.exports = yeoman.generators.NamedBase.extend({
  writing: function() {
    var templateVars = {name: this.name};
    // SomeApp/ios/SomeApp
    this.fs.copyTpl(
      this.templatePath(path.join('app', '**')),
      this.destinationPath(path.join('ios', this.name)),
      templateVars
    );

    // SomeApp/ios/SomeAppTests
    this.fs.copyTpl(
      this.templatePath(path.join('tests', 'Tests.m')),
      this.destinationPath(path.join('ios', this.name + 'Tests', this.name + 'Tests.m')),
      templateVars
    );
    this.fs.copy(
      this.templatePath(path.join('tests', 'Info.plist')),
      this.destinationPath(path.join('ios', this.name + 'Tests', 'Info.plist'))
    );

    // SomeApp/ios/SomeApp.xcodeproj
    this.fs.copyTpl(
      this.templatePath(path.join('xcodeproj', 'project.pbxproj')),
      this.destinationPath(path.join('ios', this.name + '.xcodeproj', 'project.pbxproj')),
      templateVars
    );
    this.fs.copyTpl(
      this.templatePath(path.join('xcodeproj', 'xcshareddata', 'xcschemes', '_xcscheme')),
      this.destinationPath(path.join('ios', this.name + '.xcodeproj', 'xcshareddata', 'xcschemes', this.name + '.xcscheme')),
      templateVars
    );
  },

  end: function() {
    var projectPath = path.resolve(this.destinationRoot(), 'ios', this.name);
    this.log(chalk.white.bold('To run your app on iOS:'));
    this.log(chalk.white('   cd ' + this.destinationRoot()));
    this.log(chalk.white('   react-native run-ios'));
    this.log(chalk.white('   - or -'));
    this.log(chalk.white('   Open ' + projectPath + '.xcodeproj in Xcode'));
    this.log(chalk.white('   Hit the Run button'));
  }
});
