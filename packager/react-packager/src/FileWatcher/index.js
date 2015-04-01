/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var EventEmitter  = require('events').EventEmitter;
var sane = require('sane');
var Promise = require('bluebird');
var util = require('util');
var exec = require('child_process').exec;

var detectingWatcherClass = new Promise(function(resolve) {
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

// Singleton
var fileWatcher = null;

function FileWatcher(rootConfigs) {
  if (fileWatcher) {
    // This allows us to optimize watching in the future by merging roots etc.
    throw new Error('FileWatcher can only be instantiated once');
  }

  fileWatcher = this;

  this._loading = Promise.all(
    rootConfigs.map(createWatcher)
  ).then(function(watchers) {
    watchers.forEach(function(watcher) {
      watcher.on('all', function(type, filepath, root, stat) {
        fileWatcher.emit('all', type, filepath, root, stat);
      });
    });
    return watchers;
  });
  this._loading.done();
}

util.inherits(FileWatcher, EventEmitter);

FileWatcher.prototype.end = function() {
  return this._loading.then(function(watchers) {
    watchers.forEach(function(watcher) {
      return Promise.promisify(watcher.close, watcher)();
    });
  });
};

function createWatcher(rootConfig) {
  return detectingWatcherClass.then(function(Watcher) {
    var watcher = new Watcher(rootConfig.dir, rootConfig.globs);

    return new Promise(function(resolve, reject) {
      var rejectTimeout = setTimeout(function() {
        reject(new Error([
          'Watcher took too long to load',
          'Try running `watchman` from your terminal',
          'https://facebook.github.io/watchman/docs/troubleshooting.html',
        ].join('\n')));
      }, MAX_WAIT_TIME);

      watcher.once('ready', function() {
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    });
  });
}

FileWatcher.createDummyWatcher = function() {
  var ev = new EventEmitter();
  ev.end = function() {
    return Promise.resolve();
  };
  return ev;
};
