'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');
var utils = require('../generator-utils');

module.exports = yeoman.generators.NamedBase.extend({
  constructor: function() {
    yeoman.generators.NamedBase.apply(this, arguments);
    this.option('swift', {
      desc: 'Create iOS project using Swift',
      type: Boolean,
      defaults: false
    });
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
    this.arguments = arguments[0];
  },

  composing: function() {
    if (!this.options['skip-ios']) {
      var generator = this.options.swift ? 'generator-ios-swift' : 'generator-ios-objc';
      this.composeWith('react:ios', {args: this.arguments}, {
        local: require.resolve(path.resolve(__dirname, '..', generator))
      });
    }
    if (!this.options['skip-android']) {
      this.composeWith('react:android', {args: this.arguments}, {
        local: require.resolve(path.resolve(__dirname, '..', 'generator-android'))
      });
    }
  },

  configuring: function() {
    utils.copyAndReplace(
      this.templatePath('../../../.flowconfig'),
      this.destinationPath('.flowconfig'),
      { 'Libraries\/react-native\/react-native-interface.js' : 'node_modules/react-native/Libraries/react-native/react-native-interface.js' }
    );

    this.fs.copy(
      this.templatePath('rn-cli.config.js'),
      this.destinationPath('rn-cli.config.js')
    );
    this.fs.copy(
      this.templatePath('_gitignore'),
      this.destinationPath('.gitignore')
    );
    this.fs.copy(
      this.templatePath('_watchmanconfig'),
      this.destinationPath('.watchmanconfig')
    );
  },

  writing: function() {
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
  }
});
