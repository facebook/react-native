'use strict';

var path = require('path');
var yeoman = require('yeoman-environment');

function init(projectDir, args) {
  console.log('Setting up new React Native app in ' + projectDir);
  var env = yeoman.createEnv();
  env.register(require.resolve(path.join(__dirname, 'generator')), 'react:app');
  var generator = env.create('react:app', {args: args});
  generator.destinationRoot(projectDir);
  generator.run();
}

module.exports = init;
