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
const fetch = require('node-fetch');
const imurmurhash = require('imurmurhash');
const jsonStableStringify = require('json-stable-stringify');
const path = require('path');

import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {CachedResult, GetTransformCacheKey} from './TransformCache';
import type {Reporter} from './reporting';

type FetchResultURIs = (keys: Array<string>) => Promise<Map<string, string>>;
type StoreResults = (resultsByKey: Map<string, CachedResult>) => Promise<void>;

type FetchProps = {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: TransformOptions,
};

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
  async _processKeys(keys: Array<string>): Promise<Array<?URI>> {
    let URIsByKey;
    try {
      URIsByKey = await this._fetchResultURIs(keys);
    } catch (error) {
      this._processError(error);
      return new Array(keys.length);
    }
    return keys.map(key => URIsByKey.get(key));
  }

  async fetch(key: string): Promise<?string> {
    return await this._batchProcessor.queue(key);
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

type KeyedResult = {key: string, result: CachedResult};

class KeyResultStore {

  _storeResults: StoreResults;
  _batchProcessor: BatchProcessor<KeyedResult, void>;

  async _processResults(keyResults: Array<KeyedResult>): Promise<Array<void>> {
    const resultsByKey = new Map(keyResults.map(pair => [pair.key, pair.result]));
    await this._storeResults(resultsByKey);
    return new Array(keyResults.length);
  }

  store(key: string, result: CachedResult) {
    this._batchProcessor.queue({key, result});
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
      props.getTransformCacheKey(props.sourceCode, props.filePath, props.transformOptions),
      imurmurhash(props.sourceCode).result().toString(),
    ].join('$')).digest('hex');
    return `${digest}-${path.basename(props.filePath)}`;
  }

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
   * We may want to improve that logic to return a stream instead of the whole
   * blob of transformed results. However the results are generally only a few
   * megabytes each.
   */
  async _fetchFromURI(uri: string): Promise<CachedResult> {
    const response = await fetch(uri, {method: 'GET', timeout: 8000});
    if (response.status !== 200) {
      throw new Error(`Unexpected HTTP status: ${response.status} ${response.statusText} `);
    }
    const unvalidatedResult = await response.json();
    const result = validateCachedResult(unvalidatedResult);
    if (result == null) {
      throw new Error('Server returned invalid result.');
    }
    return result;
  }

  /**
   * Wrap `_fetchFromURI` with error logging, and return an empty result instead
   * of errors. This is because the global cache is not critical to the normal
   * packager operation.
   */
  async _tryFetchingFromURI(uri: string): Promise<?CachedResult> {
    try {
      return await this._fetchFromURI(uri);
    } catch (error) {
      this._processError(error);
    }
  }

  /**
   * This may return `null` if either the cache doesn't have a value for that
   * key yet, or an error happened, processed separately.
   */
  async fetch(props: FetchProps): Promise<?CachedResult> {
    if (this._retries <= 0 || !this._profileSet.has(props.transformOptions)) {
      return null;
    }
    const uri = await this._fetcher.fetch(GlobalTransformCache.keyOf(props));
    if (uri == null) {
      return null;
    }
    return await this._tryFetchingFromURI(uri);
  }

  store(props: FetchProps, result: CachedResult) {
    if (this._store != null) {
      this._store.store(GlobalTransformCache.keyOf(props), result);
    }
  }

}

module.exports = GlobalTransformCache;
