/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var _ = require('underscore');
var crypto = require('crypto');
var declareOpts = require('../lib/declareOpts');
var fs = require('fs');
var isAbsolutePath = require('absolute-path');
var path = require('path');
var q = require('q');
var tmpdir = require('os').tmpDir();
var version = require('../../../../package.json').version;

var Promise = q.Promise;

var validateOpts = declareOpts({
  resetCache: {
    type: 'boolean',
    default: false,
  },
  cacheVersion: {
    type: 'string',
    default: '1.0',
  },
  projectRoots: {
    type: 'array',
    required: true,
  },
});
module.exports = Cache;

function Cache(options) {
  var opts = validateOpts(options);

  this._cacheFilePath = cacheFilePath(opts);

  var data;
  if (!opts.resetCache) {
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
}

Cache.prototype.get = function(filepath, loaderCb) {
  if (!isAbsolutePath(filepath)) {
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
  this._data[filepath] = loaderPromise.then(function(data) {
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

  return this._data[filepath];
};

Cache.prototype.invalidate = function(filepath){
  if (this._has(filepath)) {
    delete this._data[filepath];
  }
};

Cache.prototype.end = function() {
  return this._persistCache();
};

Cache.prototype._persistCache = function() {
  if (this._persisting != null) {
    return this._persisting;
  }

  var data = this._data;
  var cacheFilepath = this._cacheFilePath;

  this._persisting = q.all(_.values(data))
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

  return this._persisting;
};

function loadCacheSync(cachePath) {
  var ret = Object.create(null);
  if (!fs.existsSync(cachePath)) {
    return ret;
  }

  var cacheOnDisk;
  try {
    cacheOnDisk = JSON.parse(fs.readFileSync(cachePath));
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.warn('Unable to parse cache file. Will clear and continue.');
      fs.unlinkSync(cachePath);
      return ret;
    }
    throw e;
  }

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

function cacheFilePath(options) {
  var hash = crypto.createHash('md5');
  hash.update(version);

  var roots = options.projectRoots.join(',').split(path.sep).join('-');
  hash.update(roots);

  var cacheVersion = options.cacheVersion || '0';
  hash.update(cacheVersion);

  var name = 'react-packager-cache-' + hash.digest('hex');
  return path.join(tmpdir, name);
}
