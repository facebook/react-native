/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const crypto = require('crypto');
const denodeify = require('denodeify');
const fs = require('graceful-fs');
const isAbsolutePath = require('absolute-path');
const path = require('path');
const tmpDir = require('os').tmpdir();

function getObjectValues<T>(object: {[key: string]: T}): Array<T> {
  return Object.keys(object).map(key => object[key]);
}

function debounce(fn, delay) {
  var timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
}

type Record = {
  data: {[field: string]: Promise<mixed>},
  metadata: {[field: string]: Promise<mixed>},
};

class Cache {

  _cacheFilePath: string;
  _data: {[filename: string]: Record};
  _persistEventually: () => void;
  _persisting: ?Promise<boolean> | void;

  constructor({
    resetCache,
    cacheKey,
    cacheDirectory = tmpDir,
  }: {
    resetCache: boolean,
    cacheKey: string,
    cacheDirectory?: string,
  }) {
    this._cacheFilePath = Cache.getCacheFilePath(cacheDirectory, cacheKey);
    if (!resetCache) {
      this._data = this._loadCacheSync(this._cacheFilePath);
    } else {
      this._data = Object.create(null);
    }

    this._persistEventually = debounce(this._persistCache.bind(this), 2000);
  }

  static getCacheFilePath(tmpdir, ...args) {
    const hash = crypto.createHash('md5');
    args.forEach(arg => hash.update(arg));
    return path.join(tmpdir, hash.digest('hex'));
  }

  get<T>(
    filepath: string,
    field: string,
    loaderCb: (filepath: string) => Promise<T>,
  ): Promise<T> {
    if (!isAbsolutePath(filepath)) {
      throw new Error('Use absolute paths');
    }

    return this.has(filepath, field)
      /* $FlowFixMe: this class is unsound as a whole because it uses
       * untyped storage where in fact each "field" has a particular type.
       * We cannot express this using Flow. */
      ? (this._data[filepath].data[field]: Promise<T>)
      : this.set(filepath, field, loaderCb(filepath));
  }

  invalidate(filepath: string, field: ?string) {
    if (this.has(filepath, field)) {
      if (field == null) {
        delete this._data[filepath];
      } else {
        delete this._data[filepath].data[field];
      }
    }
  }

  end() {
    return this._persistCache();
  }

  has(filepath: string, field: ?string) {
    return Object.prototype.hasOwnProperty.call(this._data, filepath) &&
      (field == null || Object.prototype.hasOwnProperty.call(this._data[filepath].data, field));
  }

  set<T>(
    filepath: string,
    field: string,
    loaderPromise: Promise<T>,
  ): Promise<T> {
    let record = this._data[filepath];
    if (!record) {
      // $FlowFixMe: temporarily invalid record.
      record = (Object.create(null): Record);
      this._data[filepath] = record;
      this._data[filepath].data = Object.create(null);
      this._data[filepath].metadata = Object.create(null);
    }

    const cachedPromise = record.data[field] = loaderPromise
      .then(data => Promise.all([
        data,
        denodeify(fs.stat)(filepath),
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

    // don't cache rejected promises
    cachedPromise.catch(error => delete record.data[field]);
    return cachedPromise;
  }

  _persistCache() {
    if (this._persisting != null) {
      return this._persisting;
    }

    const data = this._data;
    const cacheFilepath = this._cacheFilePath;

    const allPromises = getObjectValues(data)
      .map(record => {
        const fieldNames = Object.keys(record.data);
        const fieldValues = getObjectValues(record.data);

        return Promise
          .all(fieldValues)
          .then(ref => {
            // $FlowFixMe: temporarily invalid record.
            const ret = (Object.create(null): Record);
            ret.metadata = record.metadata;
            ret.data = Object.create(null);
            /* $FlowFixMe(>=0.36.0 site=react_native_fb,react_native_oss) Flow
             * error detected during the deploy of Flow v0.36.0. To see the
             * error, remove this comment and run Flow */
            fieldNames.forEach((field, index) =>
              ret.data[field] = ref[index]
            );

            return ret;
          });
      }
    );

    this._persisting = Promise.all(allPromises)
      .then(values => {
        const json = Object.create(null);
        Object.keys(data).forEach((key, i) => {
          // make sure the key wasn't added nor removed after we started
          // persisting the cache
          const value = values[i];
          if (!value) {
            return;
          }

          json[key] = Object.create(null);
          json[key].metadata = data[key].metadata;
          json[key].data = value.data;
        });
        return denodeify(fs.writeFile)(cacheFilepath, JSON.stringify(json));
      })
      .catch(e => console.error(
        '[node-haste] Encountered an error while persisting cache:\n%s',
        e.stack.split('\n').map(line => '> ' + line).join('\n')
      ))
      .then(() => {
        this._persisting = null;
        return true;
      });

    return this._persisting;
  }

  _loadCacheSync(cachePath) {
    var ret = Object.create(null);
    var cacheOnDisk = loadCacheSync(cachePath);

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
        // $FlowFixMe: we should maybe avoid Object.create().
        ret[key].metadata.mtime = record.metadata.mtime;

        Object.keys(record.data).forEach(field => {
          ret[key].data[field] = Promise.resolve(record.data[field]);
        });
      }
    });

    return ret;
  }
}

function loadCacheSync(cachePath) {
  if (!fs.existsSync(cachePath)) {
    return Object.create(null);
  }

  try {
    return JSON.parse(fs.readFileSync(cachePath));
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.warn('Unable to parse cache file. Will clear and continue.');
      try {
        fs.unlinkSync(cachePath);
      } catch (err) {
        // Someone else might've deleted it.
      }
      return Object.create(null);
    }
    throw e;
  }
}

module.exports = Cache;
