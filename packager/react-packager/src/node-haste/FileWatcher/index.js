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
const denodeify = require('denodeify');
const sane = require('sane');
const execSync = require('child_process').execSync;

const MAX_WAIT_TIME = 360000;

const detectWatcherClass = () => {
  try {
    execSync('watchman version', {stdio: 'ignore'});
    return sane.WatchmanWatcher;
  } catch (e) {}
  return sane.NodeWatcher;
};

const WatcherClass = detectWatcherClass();

let inited = false;

class FileWatcher extends EventEmitter {

  constructor(rootConfigs) {
    if (inited) {
      throw new Error('FileWatcher can only be instantiated once');
    }
    inited = true;

    super();
    this._watcherByRoot = Object.create(null);

    const watcherPromises = rootConfigs.map((rootConfig) => {
      return this._createWatcher(rootConfig);
    });

    this._loading = Promise.all(watcherPromises).then(watchers => {
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
  }

  getWatchers() {
    return this._loading;
  }

  getWatcherForRoot(root) {
    return this._loading.then(() => this._watcherByRoot[root]);
  }

  isWatchman() {
    return Promise.resolve(FileWatcher.canUseWatchman());
  }

  end() {
    inited = false;
    return this._loading.then(
      (watchers) => watchers.map(
        watcher => denodeify(watcher.close).call(watcher)
      )
    );
  }

  _createWatcher(rootConfig) {
    const watcher = new WatcherClass(rootConfig.dir, {
      glob: rootConfig.globs,
      dot: false,
    });

    return new Promise((resolve, reject) => {
      const rejectTimeout = setTimeout(
        () => reject(new Error(timeoutMessage(WatcherClass))),
        MAX_WAIT_TIME
      );

      watcher.once('ready', () => {
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    });
  }

  static createDummyWatcher() {
    return Object.assign(new EventEmitter(), {
      isWatchman: () => Promise.resolve(false),
      end: () => Promise.resolve(),
    });
  }

  static canUseWatchman() {
    return WatcherClass == sane.WatchmanWatcher;
  }
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
