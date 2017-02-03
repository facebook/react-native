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

const BatchProcessor = require('./BatchProcessor');

const crypto = require('crypto');
const imurmurhash = require('imurmurhash');
const jsonStableStringify = require('json-stable-stringify');
const path = require('path');
const request = require('request');

import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {CachedResult} from './TransformCache';
import type {Reporter} from './reporting';

type FetchResultURIs = (
  keys: Array<string>,
  callback: (error?: Error, results?: Map<string, string>) => void,
) => mixed;

type StoreResults = (
  resultsByKey: Map<string, CachedResult>,
  callback: (error?: Error) => void,
) => mixed;

type FetchProps = {
  filePath: string,
  sourceCode: string,
  transformCacheKey: string,
  transformOptions: TransformOptions,
};

type FetchCallback = (error?: Error, result?: ?CachedResult) => mixed;
type FetchURICallback = (error?: Error, resultURI?: ?string) => mixed;

type URI = string;

/**
 * We aggregate the requests to do a single request for many keys. It also
 * ensures we do a single request at a time to avoid pressuring the I/O.
 */
class KeyURIFetcher {

  _batchProcessor: BatchProcessor<string, ?URI>;
  _fetchResultURIs: FetchResultURIs;
  _processError: (error: Error) => mixed;

  /**
   * When a batch request fails for some reason, we process the error locally
   * and we proceed as if there were no result for these keys instead. That way
   * a build will not fail just because of the cache.
   */
  _processKeys(
    keys: Array<string>,
    callback: (error?: Error, keyURIs: Array<?URI>) => mixed,
  ) {
    this._fetchResultURIs(keys, (error, URIsByKey) => {
      if (error != null) {
        this._processError(error);
      }
      const URIs = keys.map(key => URIsByKey && URIsByKey.get(key));
      callback(undefined, URIs);
    });
  }

  fetch(key: string, callback: FetchURICallback) {
    this._batchProcessor.queue(key, callback);
  }

  constructor(fetchResultURIs: FetchResultURIs, processError: (error: Error) => mixed) {
    this._fetchResultURIs = fetchResultURIs;
    this._batchProcessor = new BatchProcessor({
      maximumDelayMs: 10,
      maximumItems: 500,
      concurrency: 25,
    }, this._processKeys.bind(this));
    this._processError = processError;
  }

}

class KeyResultStore {

  _storeResults: StoreResults;
  _batchProcessor: BatchProcessor<{key: string, result: CachedResult}, void>;

  _processResults(
    keyResults: Array<{key: string, result: CachedResult}>,
    callback: (error?: Error) => mixed,
  ) {
    const resultsByKey = new Map(
      keyResults.map(pair => [pair.key, pair.result]),
    );
    this._storeResults(resultsByKey, error => {
      callback(error);
    });
  }

  store(key: string, result: CachedResult) {
    this._batchProcessor.queue({key, result}, () => {});
  }

  constructor(storeResults: StoreResults) {
    this._storeResults = storeResults;
    this._batchProcessor = new BatchProcessor({
      maximumDelayMs: 1000,
      maximumItems: 100,
      concurrency: 10,
    }, this._processResults.bind(this));
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
 * The transform options contain absolute paths. This can contain, for
 * example, the username if someone works their home directory (very likely).
 * We need to get rid of this user-and-machine-dependent data for the global
 * cache, otherwise nobody  would share the same cache keys.
 */
function globalizeTransformOptions(
  options: TransformOptions,
): TransformOptions {
  const {transform} = options;
  if (transform == null) {
    return options;
  }
  return {
    ...options,
    transform: {
      ...transform,
      projectRoots: transform.projectRoots.map(p => {
        return path.relative(path.join(__dirname, '../../../../..'), p);
      }),
    },
  };
}

export type TransformProfile = {+dev: boolean, +minify: boolean, +platform: string};

function profileKey({dev, minify, platform}: TransformProfile): string {
  return jsonStableStringify({dev, minify, platform});
}

/**
 * We avoid doing any request to the server if we know the server is not
 * going to have any key at all for a particular set of transform options.
 */
class TransformProfileSet {
  _profileKeys: Set<string>;
  constructor(profiles: Iterable<TransformProfile>) {
    this._profileKeys = new Set();
    for (const profile of profiles) {
      this._profileKeys.add(profileKey(profile));
    }
  }
  has(profile: TransformProfile): boolean {
    return this._profileKeys.has(profileKey(profile));
  }
}

class GlobalTransformCache {

  _fetcher: KeyURIFetcher;
  _profileSet: TransformProfileSet;
  _reporter: Reporter;
  _retries: number;
  _store: ?KeyResultStore;

  /**
   * If too many errors already happened, we just drop the additional errors.
   */
  _processError(error: Error) {
    if (this._retries <= 0) {
      return;
    }
    this._reporter.update({type: 'global_cache_error', error});
    --this._retries;
    if (this._retries <= 0) {
      this._reporter.update({type: 'global_cache_disabled', reason: 'too_many_errors'});
    }
  }

  /**
   * For using the global cache one needs to have some kind of central key-value
   * store that gets prefilled using keyOf() and the transformed results. The
   * fetching function should provide a mapping of keys to URIs. The files
   * referred by these URIs contains the transform results. Using URIs instead
   * of returning the content directly allows for independent and parallel
   * fetching of each result, that may be arbitrarily large JSON blobs.
   */
  constructor(
    fetchResultURIs: FetchResultURIs,
    storeResults: ?StoreResults,
    profiles: Iterable<TransformProfile>,
    reporter: Reporter,
  ) {
    this._fetcher = new KeyURIFetcher(fetchResultURIs, this._processError.bind(this));
    this._profileSet = new TransformProfileSet(profiles);
    this._reporter = reporter;
    this._retries = 4;
    if (storeResults != null) {
      this._store = new KeyResultStore(storeResults);
    }
  }

  /**
   * Return a key for identifying uniquely a source file.
   */
  static keyOf(props: FetchProps) {
    const stableOptions = globalizeTransformOptions(props.transformOptions);
    const digest = crypto.createHash('sha1').update([
      jsonStableStringify(stableOptions),
      props.transformCacheKey,
      imurmurhash(props.sourceCode).result().toString(),
    ].join('$')).digest('hex');
    return `${digest}-${path.basename(props.filePath)}`;
  }

  /**
   * We may want to improve that logic to return a stream instead of the whole
   * blob of transformed results. However the results are generally only a few
   * megabytes each.
   */
  _fetchFromURI(uri: string, callback: FetchCallback) {
    request.get({uri, json: true, timeout: 4000}, (error, response, unvalidatedResult) => {
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

  /**
   * Wrap `_fetchFromURI` with error logging, and return an empty result instead
   * of errors. This is because the global cache is not critical to the normal
   * packager operation.
   */
  _tryFetchingFromURI(uri: string, callback: FetchCallback) {
    this._fetchFromURI(uri, (error, result) => {
      if (error != null) {
        this._processError(error);
      }
      callback(undefined, result);
    });
  }

  fetch(props: FetchProps, callback: FetchCallback) {
    if (this._retries <= 0 || !this._profileSet.has(props.transformOptions)) {
      process.nextTick(callback);
      return;
    }
    this._fetcher.fetch(GlobalTransformCache.keyOf(props), (error, uri) => {
      if (error != null) {
        callback(error);
      } else {
        if (uri == null) {
          callback();
          return;
        }
        this._tryFetchingFromURI(uri, callback);
      }
    });
  }

  store(props: FetchProps, result: CachedResult) {
    if (this._store != null) {
      this._store.store(GlobalTransformCache.keyOf(props), result);
    }
  }

}

module.exports = GlobalTransformCache;
