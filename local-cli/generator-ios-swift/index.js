'use strict';

var chalk = require('chalk');
var path = require('path');
var yeoman = require('yeoman-generator');
var childProcess = require('child_process');

module.exports = yeoman.generators.NamedBase.extend({
  writing: function() {
    var templateVars = {name: this.name};
    // SomeApp/ios
    this.fs.copyTpl(
      this.templatePath(path.join('main', '**')),
      this.destinationPath('ios'),
      templateVars
    );
    // SomeApp/ios/SomeApp
    this.fs.copyTpl(
      this.templatePath(path.join('app', '**')),
      this.destinationPath(path.join('ios', this.name)),
      templateVars
    );
    this.fs.copy(
      this.templatePath(path.join('bridge', 'Bridging-Header.h')),
      this.destinationPath(path.join('ios', this.name, this.name + '-Bridging-Header.h'))
    );

    // SomeApp/ios/SomeAppTests
    this.fs.copyTpl(
      this.templatePath(path.join('tests', 'Tests.swift')),
      this.destinationPath(path.join('ios', this.name + 'Tests', this.name + 'Tests.swift')),
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
    this._generateBridgeHeader();
    var projectPath = path.resolve(this.destinationRoot(), 'ios', this.name);
    this.log(chalk.white.bold('Next steps:'));
    this.log(chalk.white('   Open ' + projectPath + '.xcodeproj in Xcode'));
    this.log(chalk.white('   Hit Run button'));
  },

  _generateBridgeHeader: function() {
    this.log(chalk.white.bold('Generating bridging header file from ReactNative source...'));

    var pathToReactNative = 'node_modules/react-native';
    var pathToBridgingHeader = this.destinationPath(path.join('ios', this.name, this.name + '-Bridging-Header.h'));
    var headersPaths = ['React',
      'Libraries/ActionSheetIOS',
      'Libraries/Geolocation',
      'Libraries/Image',
      'Libraries/LinkingIOS',
      'Libraries/Network',
      'Libraries/Settings',
      'Libraries/Text',
      'Libraries/Vibration',
      'Libraries/WebSocket'
    ];

    for (var index = 0; index < headersPaths.length; index++) {
      var currentHeadersRoot = this.destinationPath(path.join(pathToReactNative, headersPaths[index]));
      childProcess.execSync('find ' + currentHeadersRoot + ' -name "*.h" | awk -F\'/\' \'{print "#import \\""$NF"\\""}\' >> ' + pathToBridgingHeader);
    }
  }
});
