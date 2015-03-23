'use strict';

jest
  .dontMock('../')
  .dontMock('q')
  .setMock(
    'child_process',
    { exec: function(cmd, cb) { cb(null, '/usr/bin/watchman'); } }
  );

describe('FileWatcher', function() {
  var FileWatcher;
  var Watcher;

  beforeEach(function() {
    FileWatcher = require('../');
    Watcher = require('sane').WatchmanWatcher;
    Watcher.prototype.once.mockImplementation(function(type, callback) {
      callback();
    });
  });

  pit('it should get the watcher instance when ready', function() {
    var fileWatcher = new FileWatcher(['rootDir']);
    return fileWatcher._loading.then(function(watchers) {
      watchers.forEach(function(watcher) {
        expect(watcher instanceof Watcher).toBe(true);
      });
    });
  });

  pit('it should end the watcher', function() {
    var fileWatcher = new FileWatcher(['rootDir']);
    Watcher.prototype.close.mockImplementation(function(callback) {
      callback();
    });

    return fileWatcher.end().then(function() {
      expect(Watcher.prototype.close).toBeCalled();
    });
  });

});
