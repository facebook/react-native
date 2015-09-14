'use strict';

var path = require('path');
var utils = require('./generator-utils');
var yeoman = require('yeoman-environment');

function init(projectDir, appName) {
  console.log('Setting up new React Native app in ' + projectDir);

  var env = yeoman.createEnv();
  env.register(require.resolve(path.join(__dirname, 'generator')), 'react:app');
  var generator = env.create('react:app', {args: [appName]});
  generator.destinationRoot(projectDir);
  generator.run();
}

module.exports = init;
