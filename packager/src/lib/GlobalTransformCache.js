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
const FetchError = require('node-fetch/lib/fetch-error');

const crypto = require('crypto');
const fetch = require('node-fetch');
const jsonStableStringify = require('json-stable-stringify');
const path = require('path');

import type {
  Options as TransformWorkerOptions,
  TransformOptions,
} from '../JSTransformer/worker/worker';
import type {CachedResult, GetTransformCacheKey} from './TransformCache';

/**
 * The API that a global transform cache must comply with. To implement a
 * custom cache, implement this interface and pass it as argument to the
 * application's top-level `Server` class.
 */
export type GlobalTransformCache = {
  /**
   * Synchronously determine if it is worth trying to fetch a result from the
   * cache. This can be used, for instance, to exclude sets of options we know
   * will never be cached.
   */
  shouldFetch(props: FetchProps): boolean,

  /**
   * Try to fetch a result. It doesn't actually need to fetch from a server,
   * the global cache could be instantiated locally for example.
   */
  fetch(props: FetchProps): Promise<?CachedResult>,

  /**
   * Try to store a result, without waiting for the success or failure of the
   * operation. Consequently, the actual storage operation could be done at a
   * much later point if desired. It is recommended to actually have this
   * function be a no-op in production, and only do the storage operation from
   * a script running on your Continuous Integration platform.
   */
  store(props: FetchProps, result: CachedResult): void,
};

type FetchResultURIs = (keys: Array<string>) => Promise<Map<string, string>>;
type FetchResultFromURI = (uri: string) => Promise<?CachedResult>;
type StoreResults = (resultsByKey: Map<string, CachedResult>) => Promise<void>;

export type FetchProps = {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: TransformWorkerOptions,
};

type URI = string;

/**
 * We aggregate the requests to do a single request for many keys. It also
 * ensures we do a single request at a time to avoid pressuring the I/O.
 */
class KeyURIFetcher {

  _batchProcessor: BatchProcessor<string, ?URI>;
  _fetchResultURIs: FetchResultURIs;

  /**
   * When a batch request fails for some reason, we process the error locally
   * and we proceed as if there were no result for these keys instead. That way
   * a build will not fail just because of the cache.
   */
  async _processKeys(keys: Array<string>): Promise<Array<?URI>> {
    const URIsByKey = await this._fetchResultURIs(keys);
    return keys.map(key => URIsByKey.get(key));
  }

  async fetch(key: string): Promise<?string> {
    return await this._batchProcessor.queue(key);
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

type FetchFailedDetails =
  {+type: 'unhandled_http_status', +statusCode: number} | {+type: 'unspecified'};

class FetchFailedError extends Error {
  /** Separate object for details allows us to have a type union. */
  +details: FetchFailedDetails;

  constructor(message: string, details: FetchFailedDetails) {
    super();
    this.message = message;
    (this: any).details = details;
  }
}

/**
 * For some reason the result stored by the server for a key might mismatch what
 * we expect a result to be. So we need to verify carefully the data.
 */
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
  return null;
}

class URIBasedGlobalTransformCache {

  _fetcher: KeyURIFetcher;
  _fetchResultFromURI: FetchResultFromURI;
  _profileSet: TransformProfileSet;
  _optionsHasher: OptionsHasher;
  _store: ?KeyResultStore;

  static FetchFailedError;

  /**
   * For using the global cache one needs to have some kind of central key-value
   * store that gets prefilled using keyOf() and the transformed results. The
   * fetching function should provide a mapping of keys to URIs. The files
   * referred by these URIs contains the transform results. Using URIs instead
   * of returning the content directly allows for independent and parallel
   * fetching of each result, that may be arbitrarily large JSON blobs.
   */
  constructor(props: {
    fetchResultFromURI: FetchResultFromURI,
    fetchResultURIs: FetchResultURIs,
    profiles: Iterable<TransformProfile>,
    rootPath: string,
    storeResults: StoreResults | null,
  }) {
    this._fetcher = new KeyURIFetcher(props.fetchResultURIs);
    this._profileSet = new TransformProfileSet(props.profiles);
    this._fetchResultFromURI = props.fetchResultFromURI;
    this._optionsHasher = new OptionsHasher(props.rootPath);
    if (props.storeResults != null) {
      this._store = new KeyResultStore(props.storeResults);
    }
  }

  /**
   * Return a key for identifying uniquely a source file.
   */
  keyOf(props: FetchProps) {
    const hash = crypto.createHash('sha1');
    const {sourceCode, filePath, transformOptions} = props;
    this._optionsHasher.hashTransformWorkerOptions(hash, transformOptions);
    const cacheKey = props.getTransformCacheKey(sourceCode, filePath, transformOptions);
    hash.update(JSON.stringify(cacheKey));
    hash.update(crypto.createHash('sha1').update(sourceCode).digest('hex'));
    const digest = hash.digest('hex');
    return `${digest}-${path.basename(filePath)}`;
  }

  /**
   * We may want to improve that logic to return a stream instead of the whole
   * blob of transformed results. However the results are generally only a few
   * megabytes each.
   */
  static async _fetchResultFromURI(uri: string): Promise<CachedResult> {
    const response = await fetch(uri, {method: 'GET', timeout: 8000});
    if (response.status !== 200) {
      const msg = `Unexpected HTTP status: ${response.status} ${response.statusText} `;
      throw new FetchFailedError(msg, {
        type: 'unhandled_http_status',
        statusCode: response.status,
      });
    }
    const unvalidatedResult = await response.json();
    const result = validateCachedResult(unvalidatedResult);
    if (result == null) {
      throw new FetchFailedError('Server returned invalid result.', {type: 'unspecified'});
    }
    return result;
  }

  /**
   * It happens from time to time that a fetch fails, we want to try these again
   * a second time if we expect them to be transient. We might even consider
   * waiting a little time before retring if experience shows it's useful.
   */
  static fetchResultFromURI(uri: string): Promise<CachedResult> {
    return URIBasedGlobalTransformCache._fetchResultFromURI(uri).catch(error => {
      if (!URIBasedGlobalTransformCache.shouldRetryAfterThatError(error)) {
        throw error;
      }
      return this._fetchResultFromURI(uri);
    });
  }

  /**
   * We want to retry timeouts as they're likely temporary. We retry 503
   * (Service Unavailable) and 502 (Bad Gateway) because they may be caused by a
   * some rogue server, or because of throttling.
   *
   * There may be other types of error we'd want to retry for, but these are
   * the ones we experienced the most in practice.
   */
  static shouldRetryAfterThatError(error: Error): boolean {
    return (
      error instanceof FetchError && error.type === 'request-timeout' || (
        error instanceof FetchFailedError &&
        error.details.type === 'unhandled_http_status' &&
        (error.details.statusCode === 503 || error.details.statusCode === 502)
      )
    );
  }

  shouldFetch(props: FetchProps): boolean {
    return this._profileSet.has(props.transformOptions);
  }

  /**
   * This may return `null` if either the cache doesn't have a value for that
   * key yet, or an error happened, processed separately.
   */
  async fetch(props: FetchProps): Promise<?CachedResult> {
    const uri = await this._fetcher.fetch(this.keyOf(props));
    if (uri == null) {
      return null;
    }
    return await this._fetchResultFromURI(uri);
  }

  store(props: FetchProps, result: CachedResult) {
    if (this._store != null) {
      this._store.store(this.keyOf(props), result);
    }
  }

}

class OptionsHasher {
  _rootPath: string;

  constructor(rootPath: string) {
    this._rootPath = rootPath;
  }

  /**
   * This function is extra-conservative with how it hashes the transform
   * options. In particular:
   *
   *     * we need to hash paths relative to the root, not the absolute paths,
   *       otherwise everyone would have a different cache, defeating the
   *       purpose of global cache;
   *     * we need to reject any additional field we do not know of, because
   *       they could contain absolute path, and we absolutely want to process
   *       these.
   *
   * Theorically, Flow could help us prevent any other field from being here by
   * using *exact* object type. In practice, the transform options are a mix of
   * many different fields including the optional Babel fields, and some serious
   * cleanup will be necessary to enable rock-solid typing.
   */
  hashTransformWorkerOptions(hash: crypto$Hash, options: TransformWorkerOptions): crypto$Hash {
    const {dev, minify, platform, transform, ...unknowns} = options;
    const unknownKeys = Object.keys(unknowns);
    if (unknownKeys.length > 0) {
      const message = `these worker option fields are unknown: ${JSON.stringify(unknownKeys)}`;
      throw new CannotHashOptionsError(message);
    }
    // eslint-disable-next-line no-undef, no-bitwise
    hash.update(new Buffer([+dev | +minify << 1]));
    hash.update(JSON.stringify(platform));
    return this.hashTransformOptions(hash, transform);
  }

  /**
   * The transform options contain absolute paths. This can contain, for
   * example, the username if someone works their home directory (very likely).
   * We get rid of this local data for the global cache, otherwise nobody would
   * share the same cache keys. The project roots should not be needed as part
   * of the cache key as they should not affect the transformation of a single
   * particular file.
   */
  hashTransformOptions(hash: crypto$Hash, options: TransformOptions): crypto$Hash {
    const {generateSourceMaps, dev, hot, inlineRequires, platform,
      preloadedModules, projectRoots, ramGroups, ...unknowns} = options;
    const unknownKeys = Object.keys(unknowns);
    if (unknownKeys.length > 0) {
      const message = `these transform option fields are unknown: ${JSON.stringify(unknownKeys)}`;
      throw new CannotHashOptionsError(message);
    }
    // eslint-disable-next-line no-undef
    hash.update(new Buffer([
      // eslint-disable-next-line no-bitwise
      +dev | +generateSourceMaps << 1 | +hot << 2 | +!!inlineRequires << 3,
    ]));
    hash.update(JSON.stringify(platform));
    let relativeBlacklist = [];
    if (typeof inlineRequires === 'object') {
      relativeBlacklist = this.relativizeFilePaths(Object.keys(inlineRequires.blacklist));
    }
    const relativeProjectRoots = this.relativizeFilePaths(projectRoots);
    const optionTuple = [relativeBlacklist, preloadedModules, relativeProjectRoots, ramGroups];
    hash.update(JSON.stringify(optionTuple));
    return hash;
  }

  relativizeFilePaths(filePaths: Array<string>): Array<string> {
    return filePaths.map(filepath => path.relative(this._rootPath, filepath));
  }
}

class CannotHashOptionsError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}

URIBasedGlobalTransformCache.FetchFailedError = FetchFailedError;

module.exports = {URIBasedGlobalTransformCache, CannotHashOptionsError};
