'use strict';

var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-environment');

/**
 * Simple utility for running the android yeoman generator.
 *
 * @param  {String} projectDir root project directory (i.e. contains index.js)
 * @param  {String} name       name of the root JS module for this app
 */
module.exports = function(projectDir, name) {
  var oldCwd = process.cwd();
  process.chdir(projectDir);

  var env = yeoman.createEnv();
  var generatorPath = path.join(__dirname, 'generator');
  env.register(generatorPath, 'react:app');
  var args = ['react:app', name].concat(process.argv.slice(4));
  env.run(args, {'skip-ios': true}, function() {
    process.chdir(oldCwd);
  });
};
