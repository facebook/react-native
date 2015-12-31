/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const EventEmitter  = require('events').EventEmitter;
const sane = require('sane');
const Promise = require('promise');
const exec = require('child_process').exec;

const MAX_WAIT_TIME = 120000;

// TODO(amasad): can we use watchman version command instead?
const detectingWatcherClass = new Promise(function(resolve) {
  exec('which watchman', function(err, out) {
    if (err || out.length === 0) {
      resolve(sane.NodeWatcher);
    } else {
      resolve(sane.WatchmanWatcher);
    }
  });
});

let inited = false;

class FileWatcher extends EventEmitter {

  constructor(rootConfigs) {
    if (inited) {
      throw new Error('FileWatcher can only be instantiated once');
    }
    inited = true;

    super();
    this._watcherByRoot = Object.create(null);

    this._loading = Promise.all(
      rootConfigs.map(createWatcher)
    ).then(watchers => {
      watchers.forEach((watcher, i) => {
        this._watcherByRoot[rootConfigs[i].dir] = watcher;
        watcher.on(
          'all',
          // args = (type, filePath, root, stat)
          (...args) => this.emit('all', ...args)
        );
      });
      return watchers;
    });

    this._loading.done();
  }

  getWatchers() {
    return this._loading;
  }

  getWatcherForRoot(root) {
    return this._loading.then(() => this._watcherByRoot[root]);
  }

  isWatchman() {
    return detectingWatcherClass.then(
      Watcher => Watcher === sane.WatchmanWatcher
    );
  }

  end() {
    inited = false;
    return this._loading.then(
      (watchers) => watchers.map(
        watcher => Promise.denodeify(watcher.close).call(watcher)
      )
    );
  }

  static createDummyWatcher() {
    return Object.assign(new EventEmitter(), {
      isWatchman: () => Promise.resolve(false),
      end: () => Promise.resolve(),
    });
  }
}

function createWatcher(rootConfig) {
  return detectingWatcherClass.then(function(Watcher) {
    const watcher = new Watcher(rootConfig.dir, {
      glob: rootConfig.globs,
      dot: false,
    });

    return new Promise(function(resolve, reject) {
      const rejectTimeout = setTimeout(function() {
        reject(new Error(timeoutMessage(Watcher)));
      }, MAX_WAIT_TIME);

      watcher.once('ready', function() {
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    });
  });
}

function timeoutMessage(Watcher) {
  const lines = [
    'Watcher took too long to load (' + Watcher.name + ')',
  ];
  if (Watcher === sane.WatchmanWatcher) {
    lines.push(
      'Try running `watchman version` from your terminal',
      'https://facebook.github.io/watchman/docs/troubleshooting.html',
    );
  }
  return lines.join('\n');
}

module.exports = FileWatcher;
