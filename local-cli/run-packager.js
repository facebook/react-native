'use strict';

var path = require('path');
var child_process = require('child_process');

module.exports = function(newWindow) {
  if (newWindow) {
    child_process.spawnSync('open', [
      path.resolve(__dirname, '..', 'packager', 'launchPackager.command')
    ]);
  } else {
    child_process.spawn('sh', [
        path.resolve(__dirname, '..', 'packager', 'packager.sh'),
        '--projectRoots',
        process.cwd(),
      ], {stdio: 'inherit'});
  }
};