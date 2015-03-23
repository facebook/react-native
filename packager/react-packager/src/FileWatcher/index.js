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
var q = require('q');
var util = require('util');
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

function FileWatcher(projectRoots) {
  var self = this;
  this._loading = q.all(
    projectRoots.map(createWatcher)
  ).then(function(watchers) {
    watchers.forEach(function(watcher) {
      watcher.on('all', function(type, filepath, root) {
        self.emit('all', type, filepath, root);
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
      delete watchersByRoot[watcher._root];
      return q.ninvoke(watcher, 'close');
    });
  });
};

var watchersByRoot = Object.create(null);

function createWatcher(root) {
  if (watchersByRoot[root] != null) {
    return Promise.resolve(watchersByRoot[root]);
  }

  return detectingWatcherClass.then(function(Watcher) {
    var watcher = new Watcher(root, {glob: ['**/*.js', '**/package.json']});

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
        watchersByRoot[root] = watcher;
        watcher._root = root;
        resolve(watcher);
      });
    });
  });
}

FileWatcher.createDummyWatcher = function() {
  var ev = new EventEmitter();
  ev.end = function() {
    return q();
  };
  return ev;
};
