'use strict';

var path = require('path');
var child_process = require('child_process');

module.exports = function(newWindow) {
  if (newWindow) {
    child_process.spawnSync('open', [
      path.resolve(__dirname, '..', 'packager', 'launchPackager.command')
    ]);
  } else {
      child_process.spawn('node', [
          path.resolve(__dirname, '..', 'packager', 'packager.js'),
          '--projectRoots',
          process.cwd(),
      ], {stdio: 'inherit'});
  }
};