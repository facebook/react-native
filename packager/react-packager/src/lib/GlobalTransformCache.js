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

const crypto = require('crypto');
const imurmurhash = require('imurmurhash');
const invariant = require('invariant');
const jsonStableStringify = require('json-stable-stringify');
const path = require('path');
const request = require('request');

import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {CachedResult} from './TransformCache';

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

type FetchCallback = (error?: Error, resultURI?: ?CachedResult) => mixed;
type FetchURICallback = (error?: Error, resultURI?: ?string) => mixed;

type ProcessBatch<TItem, TResult> = (
  batch: Array<TItem>,
  callback: (error?: Error, orderedResults?: Array<TResult>) => mixed,
) => mixed;
type BatchProcessorOptions = {
  maximumDelayMs: number,
  maximumItems: number,
  concurrency: number,
};

/**
 * We batch keys together trying to make a smaller amount of queries. For that
 * we wait a small moment before starting to fetch. We limit also the number of
 * keys we try to fetch at once, so if we already have that many keys pending,
 * we can start fetching right away.
 */
class BatchProcessor<TItem, TResult> {

  _options: BatchProcessorOptions;
  _processBatch: ProcessBatch<TItem, TResult>;
  _queue: Array<{
    item: TItem,
    callback: (error?: Error, result?: TResult) => mixed,
  }>;
  _timeoutHandle: ?number;
  _currentProcessCount: number;

  constructor(
    options: BatchProcessorOptions,
    processBatch: ProcessBatch<TItem, TResult>,
  ) {
    this._options = options;
    this._processBatch = processBatch;
    this._queue = [];
    this._timeoutHandle = null;
    this._currentProcessCount = 0;
    (this: any)._processQueue = this._processQueue.bind(this);
  }

  _processQueue() {
    this._timeoutHandle = null;
    while (
      this._queue.length > 0 &&
      this._currentProcessCount < this._options.concurrency
    ) {
      this._currentProcessCount++;
      const jobs = this._queue.splice(0, this._options.maximumItems);
      const items = jobs.map(job => job.item);
      this._processBatch(items, (error, results) => {
        invariant(
          results == null || results.length === items.length,
          'Not enough results returned.',
        );
        for (let i = 0; i < items.length; ++i) {
          jobs[i].callback(error, results && results[i]);
        }
        this._currentProcessCount--;
        this._processQueueOnceReady();
      });
    }
  }

  _processQueueOnceReady() {
    if (this._queue.length >= this._options.maximumItems) {
      clearTimeout(this._timeoutHandle);
      process.nextTick(this._processQueue);
      return;
    }
    if (this._timeoutHandle == null) {
      this._timeoutHandle = setTimeout(
        this._processQueue,
        this._options.maximumDelayMs,
      );
    }
  }

  queue(
    item: TItem,
    callback: (error?: Error, result?: TResult) => mixed,
  ) {
    this._queue.push({item, callback});
    this._processQueueOnceReady();
  }

}

type URI = string;

/**
 * We aggregate the requests to do a single request for many keys. It also
 * ensures we do a single request at a time to avoid pressuring the I/O.
 */
class KeyURIFetcher {

  _fetchResultURIs: FetchResultURIs;
  _batchProcessor: BatchProcessor<string, ?URI>;

  _processKeys(
    keys: Array<string>,
    callback: (error?: Error, keyURIs: Array<?URI>) => mixed,
  ) {
    this._fetchResultURIs(keys, (error, URIsByKey) => {
      const URIs = keys.map(key => URIsByKey && URIsByKey.get(key));
      callback(error, URIs);
    });
  }

  fetch(key: string, callback: FetchURICallback) {
    this._batchProcessor.queue(key, callback);
  }

  constructor(fetchResultURIs: FetchResultURIs) {
    this._fetchResultURIs = fetchResultURIs;
    this._batchProcessor = new BatchProcessor({
      maximumDelayMs: 10,
      maximumItems: 500,
      concurrency: 25,
    }, this._processKeys.bind(this));
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

/**
 * One can enable the global cache by calling configure() from a custom CLI
 * script. Eventually we may make it more flexible.
 */
class GlobalTransformCache {

  _fetcher: KeyURIFetcher;
  _store: ?KeyResultStore;
  static _global: ?GlobalTransformCache;

  constructor(
    fetchResultURIs: FetchResultURIs,
    storeResults?: StoreResults,
  ) {
    this._fetcher = new KeyURIFetcher(fetchResultURIs);
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

  store(props: FetchProps, result: CachedResult) {
    if (this._store != null) {
      this._store.store(GlobalTransformCache.keyOf(props), result);
    }
  }

  /**
   * For using the global cache one needs to have some kind of central key-value
   * store that gets prefilled using keyOf() and the transformed results. The
   * fetching function should provide a mapping of keys to URIs. The files
   * referred by these URIs contains the transform results. Using URIs instead
   * of returning the content directly allows for independent fetching of each
   * result.
   */
  static configure(
    fetchResultURIs: FetchResultURIs,
    storeResults?: StoreResults,
  ) {
    GlobalTransformCache._global = new GlobalTransformCache(
      fetchResultURIs,
      storeResults,
    );
  }

  static get() {
    return GlobalTransformCache._global;
  }

}

GlobalTransformCache._global = null;

module.exports = GlobalTransformCache;
