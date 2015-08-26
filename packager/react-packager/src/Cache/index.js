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
var Promise = require('promise');
var tmpdir = require('os').tmpDir();
var version = require('../../../../package.json').version;

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
  transformModulePath: {
    type:'string',
    required: true,
  },
});

// TODO: move to Packager directory
class Cache {
  constructor(options) {
    var opts = validateOpts(options);

    this._cacheFilePath = this._getCacheFilePath(opts);

    var data;
    if (!opts.resetCache) {
      data = this._loadCacheSync(this._cacheFilePath);
    } else {
      data = Object.create(null);
    }
    this._data = data;

    this._persistEventually = _.debounce(
      this._persistCache.bind(this),
      2000,
    );
  }

  get(filepath, field, loaderCb) {
    if (!isAbsolutePath(filepath)) {
      throw new Error('Use absolute paths');
    }

    var recordP = this._has(filepath, field)
      ? this._data[filepath].data[field]
      : this._set(filepath, field, loaderCb(filepath));

    return recordP.then(record => record);
  }

  invalidate(filepath) {
    if (this._has(filepath)) {
      delete this._data[filepath];
    }
  }

  end() {
    return this._persistCache();
  }

  _has(filepath, field) {
    return Object.prototype.hasOwnProperty.call(this._data, filepath) &&
      (!field || Object.prototype.hasOwnProperty.call(this._data[filepath].data, field));
  }

  _set(filepath, field, loaderPromise) {
    let record = this._data[filepath];
    if (!record) {
      record = Object.create(null);
      this._data[filepath] = record;
      this._data[filepath].data = Object.create(null);
      this._data[filepath].metadata = Object.create(null);
    }

    record.data[field] = loaderPromise
      .then(data => Promise.all([
        data,
        Promise.denodeify(fs.stat)(filepath),
      ]))
      .then(([data, stat]) => {
        this._persistEventually();

        // Evict all existing field data from the cache if we're putting new
        // more up to date data
        var mtime = stat.mtime.getTime();
        if (record.metadata.mtime !== mtime) {
          record.data = Object.create(null);
        }
        record.metadata.mtime = mtime;

        return data;
      });

    return record.data[field];
  }

  _persistCache() {
    if (this._persisting != null) {
      return this._persisting;
    }

    var data = this._data;
    var cacheFilepath = this._cacheFilePath;

    var allPromises = _.values(data)
      .map(record => {
        var fieldNames = Object.keys(record.data);
        var fieldValues = _.values(record.data);

        return Promise
          .all(fieldValues)
          .then(ref => {
            var ret = Object.create(null);
            ret.metadata = record.metadata;
            ret.data = Object.create(null);
            fieldNames.forEach((field, index) =>
              ret.data[field] = ref[index]
            );

            return ret;
          });
      }
    );

    this._persisting = Promise.all(allPromises)
      .then(values => {
        var json = Object.create(null);
        Object.keys(data).forEach((key, i) => {
          json[key] = Object.create(null);
          json[key].metadata = data[key].metadata;
          json[key].data = values[i].data;
        });
        return Promise.denodeify(fs.writeFile)(cacheFilepath, JSON.stringify(json));
      })
      .then(() => {
        this._persisting = null;
        return true;
      });

    return this._persisting;
  }

  _loadCacheSync(cachePath) {
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
    Object.keys(cacheOnDisk).forEach(key => {
      if (!fs.existsSync(key)) {
        return;
      }
      var record = cacheOnDisk[key];
      var stat = fs.statSync(key);
      if (stat.mtime.getTime() === record.metadata.mtime) {
        ret[key] = Object.create(null);
        ret[key].metadata = Object.create(null);
        ret[key].data = Object.create(null);
        ret[key].metadata.mtime = record.metadata.mtime;

        Object.keys(record.data).forEach(field => {
          ret[key].data[field] = Promise.resolve(record.data[field]);
        });
      }
    });

    return ret;
  }

  _getCacheFilePath(options) {
    var hash = crypto.createHash('md5');
    hash.update(version);

    var roots = options.projectRoots.join(',').split(path.sep).join('-');
    hash.update(roots);

    var cacheVersion = options.cacheVersion || '0';
    hash.update(cacheVersion);

    hash.update(options.transformModulePath);

    var name = 'react-packager-cache-' + hash.digest('hex');

    return path.join(tmpdir, name);
  }
}

module.exports = Cache;
