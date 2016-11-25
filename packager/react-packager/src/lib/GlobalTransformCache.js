/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const debounce = require('lodash/debounce');
const imurmurhash = require('imurmurhash');
const jsonStableStringify = require('json-stable-stringify');
const path = require('path');
const request = require('request');
const toFixedHex = require('./toFixedHex');

import type {CachedResult} from './TransformCache';

const SINGLE_REQUEST_MAX_KEYS = 100;
const AGGREGATION_DELAY_MS = 100;

type FetchResultURIs = (
  keys: Array<string>,
  callback: (error?: Error, results?: Map<string, string>) => void,
) => mixed;

type FetchProps = {
  filePath: string,
  sourceCode: string,
  transformCacheKey: string,
  transformOptions: mixed,
};

type FetchCallback = (error?: Error, resultURI?: ?CachedResult) => mixed;
type FetchURICallback = (error?: Error, resultURI?: ?string) => mixed;

/**
 * We aggregate the requests to do a single request for many keys. It also
 * ensures we do a single request at a time to avoid pressuring the I/O.
 */
class KeyURIFetcher {

  _fetchResultURIs: FetchResultURIs;
  _pendingQueries: Array<{key: string, callback: FetchURICallback}>;
  _isProcessing: boolean;
  _processQueriesDebounced: () => void;
  _processQueries: () => void;

  /**
   * Fetch the pending keys right now, if any and if we're not already doing
   * so in parallel. At the end of the fetch, we trigger a new batch fetching
   * recursively.
   */
  _processQueries() {
    const {_pendingQueries} = this;
    if (_pendingQueries.length === 0 || this._isProcessing) {
      return;
    }
    this._isProcessing = true;
    const queries = _pendingQueries.splice(0, SINGLE_REQUEST_MAX_KEYS);
    const keys = queries.map(query => query.key);
    this._fetchResultURIs(keys, (error, results) => {
      queries.forEach(query => {
        query.callback(error, results && results.get(query.key));
      });
      this._isProcessing = false;
      process.nextTick(this._processQueries);
    });
  }

  /**
   * Enqueue the fetching of a particular key.
   */
  fetch(key: string, callback: FetchURICallback) {
    this._pendingQueries.push({key, callback});
    this._processQueriesDebounced();
  }

  constructor(fetchResultURIs: FetchResultURIs) {
    this._fetchResultURIs = fetchResultURIs;
    this._pendingQueries = [];
    this._isProcessing = false;
    this._processQueries = this._processQueries.bind(this);
    this._processQueriesDebounced =
      debounce(this._processQueries, AGGREGATION_DELAY_MS);
  }

}

function validateCachedResult(cachedResult: mixed): ?CachedResult {
  if (
    cachedResult != null &&
    typeof cachedResult === 'object' &&
    typeof cachedResult.code === 'string' &&
    Array.isArray(cachedResult.dependencies) &&
    cachedResult.dependencies.every(dep => typeof dep === 'string') &&
    Array.isArray(cachedResult.dependencyOffsets) &&
    cachedResult.dependencyOffsets.every(offset => typeof offset === 'number')
  ) {
    return (cachedResult: any);
  }
  return undefined;
}

/**
 * One can enable the global cache by calling configure() from a custom CLI
 * script. Eventually we may make it more flexible.
 */
class GlobalTransformCache {

  _fetcher: KeyURIFetcher;
  static _global: ?GlobalTransformCache;

  constructor(fetchResultURIs: FetchResultURIs) {
    this._fetcher = new KeyURIFetcher(fetchResultURIs);
  }

  /**
   * Return a key for identifying uniquely a source file.
   */
  static keyOf(props: FetchProps) {
    const sourceDigest = toFixedHex(8, imurmurhash(props.sourceCode).result());
    const optionsHash = imurmurhash()
      .hash(jsonStableStringify(props.transformOptions) || '')
      .hash(props.transformCacheKey)
      .result();
    const optionsDigest = toFixedHex(8, optionsHash);
    return (
      `${optionsDigest}${sourceDigest}` +
      `${path.basename(props.filePath)}`
    );
  }

  /**
   * We may want to improve that logic to return a stream instead of the whole
   * blob of transformed results. However the results are generally only a few
   * megabytes each.
   */
  _fetchFromURI(uri: string, callback: FetchCallback) {
    request.get({uri, json: true}, (error, response, unvalidatedResult) => {
      if (error != null) {
        callback(error);
        return;
      }
      if (response.statusCode !== 200) {
        callback(new Error(
          `Unexpected HTTP status code: ${response.statusCode}`,
        ));
        return;
      }
      const result = validateCachedResult(unvalidatedResult);
      if (result == null) {
        callback(new Error('Invalid result returned by server.'));
        return;
      }
      callback(undefined, result);
    });
  }

  fetch(props: FetchProps, callback: FetchCallback) {
    this._fetcher.fetch(GlobalTransformCache.keyOf(props), (error, uri) => {
      if (error != null) {
        callback(error);
      } else {
        if (uri == null) {
          callback();
          return;
        }
        this._fetchFromURI(uri, callback);
      }
    });
  }

  /**
   * For using the global cache one needs to have some kind of central key-value
   * store that gets prefilled using keyOf() and the transformed results. The
   * fetching function should provide a mapping of keys to URIs. The files
   * referred by these URIs contains the transform results. Using URIs instead
   * of returning the content directly allows for independent fetching of each
   * result.
   */
  static configure(fetchResultURIs: FetchResultURIs) {
    GlobalTransformCache._global = new GlobalTransformCache(fetchResultURIs);
  }

  static get() {
    return GlobalTransformCache._global;
  }

}

GlobalTransformCache._global = null;

module.exports = GlobalTransformCache;
