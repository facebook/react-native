'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');

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

    // this passes command line arguments down to the composed generators
    var args = arguments[0];
    if (!this.options['skip-ios']) {
      this.composeWith('react:ios', {args: args}, {
        local: require.resolve(path.resolve(__dirname, '..', 'generator-ios'))
      });
    }
    if (!this.options['skip-android']) {
      this.composeWith('react:android', {args: args}, {
        local: require.resolve(path.resolve(__dirname, '..', 'generator-android'))
      });
    }
  },

  configuring: function() {
    this.fs.copy(
      this.templatePath('_flowconfig'),
      this.destinationPath('.flowconfig')
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
