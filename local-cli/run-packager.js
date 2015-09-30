'use strict';

var path = require('path');
var child_process = require('child_process');

module.exports = function(newWindow) {
  if (newWindow) {
    var launchPackagerScript =
      path.resolve(__dirname, '..', 'packager', 'launchPackager.command');
    if (process.platform === 'darwin') {
      child_process.spawnSync('open', [launchPackagerScript]);
    } else if (process.platform === 'linux') {
      child_process.spawn(
        'xterm',
        ['-e', 'sh', launchPackagerScript],
        {detached: true});
    }
  } else {
    child_process.spawn('sh', [
        path.resolve(__dirname, '..', 'packager', 'packager.sh'),
        '--projectRoots',
        process.cwd(),
      ], {stdio: 'inherit'});
  }
};
