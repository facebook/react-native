'use strict';

var sane = require('sane');
var q = require('q');
var exec = require('child_process').exec;

var Promise = q.Promise;

var detectingWatcherClass = new Promise(function(resolve, reject) {
  exec('which watchman', function(err, out) {
    if (err || out.length === 0) {
      resolve(sane.NodeWatcher);
    } else {
      resolve(sane.WatchmanWatcher);
    }
  });
});

module.exports = FileWatcher;

var MAX_WAIT_TIME = 3000;

var memoizedInstances = Object.create(null);

function FileWatcher(projectRoot) {
  if (memoizedInstances[projectRoot]) {
    return memoizedInstances[projectRoot];
  } else {
    memoizedInstances[projectRoot] = this;
  }

  this._loadingWatcher = detectingWatcherClass.then(function(Watcher) {
    var watcher = new Watcher(projectRoot, {glob: '**/*.js'});

    return new Promise(function(resolve, reject) {
      var rejectTimeout = setTimeout(function() {
        reject(new Error('Watcher took too long to load.'));
      }, MAX_WAIT_TIME);

      watcher.once('ready', function() {
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    });
  });
}

FileWatcher.prototype.getWatcher = function() {
  return this._loadingWatcher;
};

FileWatcher.prototype.end = function() {
  return this._loadingWatcher.then(function(watcher) {
    return q.ninvoke(watcher, 'close');
  });
};
