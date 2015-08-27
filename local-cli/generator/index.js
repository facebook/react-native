'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');

module.exports = yeoman.generators.NamedBase.extend({
  constructor: function() {
    yeoman.generators.NamedBase.apply(this, arguments);

    this.composeWith('react:ios', {args: [this.name]}, {
      local: require.resolve(path.resolve(__dirname, '..', 'generator-ios'))
    });
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
    this.fs.copyTpl(
      this.templatePath('index.ios.js'),
      this.destinationPath('index.ios.js'),
      {name: this.name}
    );
  }
});
