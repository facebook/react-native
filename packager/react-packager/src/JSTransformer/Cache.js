'use strict';

var path = require('path');
var version = require('../../package.json').version;
var tmpdir = require('os').tmpDir();
var pathUtils = require('../fb-path-utils');
var FileWatcher = require('../FileWatcher');
var fs = require('fs');
var _ = require('underscore');
var q = require('q');

var Promise = q.Promise;

module.exports = Cache;

function Cache(projectConfig) {
  this._cacheFilePath = path.join(
    tmpdir,
    'React-Packager-JSTransformer-' + version + '-' +
    projectConfig.projectRoot.split(path.sep).join('-') +
    '-' + (projectConfig.cacheVersion || '0')
  );

  var data;
  if (!projectConfig.resetCache) {
    data = loadCacheSync(this._cacheFilePath);
  } else {
    data = Object.create(null);
  }
  this._data = data;

  this._has = Object.prototype.hasOwnProperty.bind(data);
  this._persistEventually = _.debounce(
    this._persistCache.bind(this),
    2000
  );

  this._fileWatcher = new FileWatcher(projectConfig);
  this._fileWatcher
    .getWatcher()
    .done(function(watcher) {
      watcher.on('all', function(type, filepath) {
        var absPath = path.join(projectConfig.projectRoot, filepath);
        delete data[absPath];
      });
    }.bind(this));
}

Cache.prototype.get = function(filepath, loaderCb) {
  if (!pathUtils.isAbsolutePath(filepath)) {
    throw new Error('Use absolute paths');
  }

  var recordP = this._has(filepath)
    ? this._data[filepath]
    : this._set(filepath, loaderCb(filepath));

  return recordP.then(function(record) {
    return record.data;
  });
};

Cache.prototype._set = function(filepath, loaderPromise) {
  return this._data[filepath] = loaderPromise.then(function(data) {
    return [
      data,
      q.nfbind(fs.stat)(filepath)
    ];
  }).spread(function(data, stat) {
    this._persistEventually();
    return {
      data: data,
      mtime: stat.mtime.getTime(),
    };
  }.bind(this));
};

Cache.prototype.end = function() {
  return q.all([
    this._persistCache(),
    this._fileWatcher.end()
  ]);
};

Cache.prototype._persistCache = function() {
  if (this._persisting != null) {
    return this._persisting;
  }

  var data = this._data;
  var cacheFilepath = this._cacheFilePath;

  return this._persisting = q.all(_.values(data))
    .then(function(values) {
      var json = Object.create(null);
      Object.keys(data).forEach(function(key, i) {
        json[key] = values[i];
      });
      return q.nfbind(fs.writeFile)(cacheFilepath, JSON.stringify(json));
    })
    .then(function() {
      this._persisting = null;
      return true;
    }.bind(this));
};

function loadCacheSync(cacheFilepath) {
  var ret = Object.create(null);
  if (!fs.existsSync(cacheFilepath)) {
    return ret;
  }

  var cacheOnDisk = JSON.parse(fs.readFileSync(cacheFilepath));

  // Filter outdated cache and convert to promises.
  Object.keys(cacheOnDisk).forEach(function(key) {
    if (!fs.existsSync(key)) {
      return;
    }
    var value = cacheOnDisk[key];
    var stat = fs.statSync(key);
    if (stat.mtime.getTime() === value.mtime) {
      ret[key] = Promise.resolve(value);
    }
  });

  return ret;
}
