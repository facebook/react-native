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
    exec: function(cmd, cb) {
      cb(null, '/usr/bin/watchman');
    },
  });

var sane = require('sane');

describe('FileWatcher', function() {
  var Watcher;
  var FileWatcher;
  var config;

  beforeEach(function() {
    Watcher = sane.WatchmanWatcher;
    Watcher.prototype.once.mockImplementation(function(type, callback) {
      callback();
    });
    FileWatcher = require('../');

    config = [{
      dir: 'rootDir',
      globs: [
        '**/*.js',
        '**/*.json',
      ],
    }];
  });

  pit('it should get the watcher instance when ready', function() {
    var fileWatcher = new FileWatcher(config);
    return fileWatcher.getWatchers().then(function(watchers) {
      watchers.forEach(function(watcher) {
        expect(watcher instanceof Watcher).toBe(true);
      });
    });
  });

  pit('should emit events', function() {
    var cb;
    Watcher.prototype.on.mockImplementation(function(type, callback) {
      cb = callback;
    });
    var fileWatcher = new FileWatcher(config);
    var handler = jest.genMockFn();
    fileWatcher.on('all', handler);
    return fileWatcher.getWatchers().then(function() {
      cb(1, 2, 3, 4);
      jest.runAllTimers();
      expect(handler.mock.calls[0]).toEqual([1, 2, 3, 4]);
    });
  });

  pit('it should end the watcher', function() {
    var fileWatcher = new FileWatcher(config);
    Watcher.prototype.close.mockImplementation(function(callback) {
      callback();
    });

    return fileWatcher.end().then(function() {
      expect(Watcher.prototype.close).toBeCalled();
    });
  });
});
