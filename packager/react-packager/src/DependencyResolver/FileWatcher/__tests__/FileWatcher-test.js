/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .dontMock('util')
  .dontMock('events')
  .dontMock('../')
  .setMock('child_process', {
    exec: (cmd, cb) => cb(null, '/usr/bin/watchman'),
  });

const sane = require('sane');

describe('FileWatcher', () => {
  let WatchmanWatcher;
  let NodeWatcher;
  let FileWatcher;
  let config;

  beforeEach(() => {
    WatchmanWatcher = sane.WatchmanWatcher;
    WatchmanWatcher.prototype.once.mockImplementation(
      (type, callback) => callback()
    );
    NodeWatcher = sane.NodeWatcher;
    NodeWatcher.prototype.once.mockImplementation(
      (type, callback) => callback()
    );

    FileWatcher = require('../');

    config = [{
      dir: 'rootDir',
      globs: [
        '**/*.js',
        '**/*.json',
      ],
    }];
  });

  pit('gets the watcher instance when ready', () => {
    const fileWatcher = new FileWatcher(config, {useWatchman: true});
    return fileWatcher.getWatchers().then(watchers => {
      watchers.forEach(watcher => {
        expect(watcher instanceof WatchmanWatcher).toBe(true);
      });
    });
  });

  pit('gets the node watcher if watchman is disabled', () => {
    const fileWatcher = new FileWatcher(config, {useWatchman: false});
    return fileWatcher.getWatchers().then(watchers => {
      watchers.forEach(watcher => {
        expect(watcher instanceof NodeWatcher).toBe(true);
      });
    });
  });

  pit('emits events', () => {
    let cb;
    WatchmanWatcher.prototype.on.mockImplementation((type, callback) => {
      cb = callback;
    });
    const fileWatcher = new FileWatcher(config, {useWatchman: true});
    const handler = jest.genMockFn();
    fileWatcher.on('all', handler);
    return fileWatcher.getWatchers().then(watchers => {
      cb(1, 2, 3, 4);
      jest.runAllTimers();
      expect(handler.mock.calls[0]).toEqual([1, 2, 3, 4]);
    });
  });

  pit('ends the watcher', () => {
    const fileWatcher = new FileWatcher(config, {useWatchman: true});
    WatchmanWatcher.prototype.close.mockImplementation(callback => callback());

    return fileWatcher.end().then(() => {
      expect(WatchmanWatcher.prototype.close).toBeCalled();
    });
  });
});
