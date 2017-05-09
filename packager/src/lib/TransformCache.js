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
const debugRead = require('debug')('RNP:TransformCache:Read');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const terminal = require('../lib/terminal');
const writeFileAtomicSync = require('write-file-atomic').sync;

import type {Options as WorkerOptions} from '../JSTransformer/worker/worker';
import type {MappingsMap} from './SourceMap';
import type {Reporter} from './reporting';

type CacheFilePaths = {transformedCode: string, metadata: string};
export type GetTransformCacheKey = (options: {}) => string;

const CACHE_NAME = 'react-native-packager-cache';
const CACHE_SUB_DIR = 'cache';

/**
 * If packager is running for two different directories, we don't want the
 * caches to conflict with each other. `__dirname` carries that because packager
 * will be, for example, installed in a different `node_modules/` folder for
 * different projects.
 */
const getCacheDirPath = (function() {
  let dirPath;
  return function() {
    if (dirPath != null) {
      return dirPath;
    }
    const hash = crypto.createHash('sha1').update(__dirname);
    if (process.getuid != null) {
      hash.update(process.getuid().toString());
    }
    dirPath = path.join(require('os').tmpdir(), CACHE_NAME + '-' + hash.digest('hex'));
    require('debug')('RNP:TransformCache:Dir')(
      `transform cache directory: ${dirPath}`
    );
    return dirPath;
  };
})();

function hashSourceCode(props: {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: WorkerOptions,
  transformOptionsKey: string,
}): string {
  return crypto.createHash('sha1')
    .update(props.getTransformCacheKey(props.transformOptions))
    .update(props.sourceCode)
    .digest('hex');
}

/**
 * The path, built as a hash, does not take the source code itself into account
 * because it would generate lots of file during development. (The source hash
 * is stored in the metadata instead).
 */
function getCacheFilePaths(props: {
  filePath: string,
  transformOptionsKey: string,
}): CacheFilePaths {
  const hasher = crypto.createHash('sha1')
    .update(props.filePath)
    .update(props.transformOptionsKey);
  const hash = hasher.digest('hex');
  const prefix = hash.substr(0, 2);
  const fileName = `${hash.substr(2)}`;
  const base = path.join(getCacheDirPath(), CACHE_SUB_DIR, prefix, fileName);
  return {transformedCode: base, metadata: base + '.meta'};
}

export type CachedResult = {
  code: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  map?: ?MappingsMap,
};

export type TransformCacheResult = {|
  +result: ?CachedResult,
  +outdatedDependencies: $ReadOnlyArray<string>,
|};

/**
 * We want to unlink all cache files before writing, so that it is as much
 * atomic as possible.
 */
function unlinkIfExistsSync(filePath: string) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

/**
 * In the workers we are fine doing sync work because a worker is meant to
 * process a single source file at a time.
 *
 * We store the transformed JS because it is likely to be much bigger than the
 * rest of the data JSON. Probably the map should be stored separately as well.
 *
 * We make the write operation as much atomic as possible: indeed, if another
 * process is reading the cache at the same time, there would be a risk it
 * reads new transformed code, but old metadata. This is avoided by removing
 * the files first.
 *
 * There is still a risk of conflincting writes, that is mitigated by hashing
 * the result code, that is verified at the end. In case of writes happening
 * close to each others, one of the workers is going to loose its results no
 * matter what.
 */
function writeSync(props: {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: WorkerOptions,
  transformOptionsKey: string,
  result: CachedResult,
}): void {
  const cacheFilePath = getCacheFilePaths(props);
  mkdirp.sync(path.dirname(cacheFilePath.transformedCode));
  const {result} = props;
  unlinkIfExistsSync(cacheFilePath.transformedCode);
  unlinkIfExistsSync(cacheFilePath.metadata);
  writeFileAtomicSync(cacheFilePath.transformedCode, result.code);
  writeFileAtomicSync(cacheFilePath.metadata, JSON.stringify([
    crypto.createHash('sha1').update(result.code).digest('hex'),
    hashSourceCode(props),
    result.dependencies,
    result.dependencyOffsets,
    result.map,
  ]));
}

export type CacheOptions = {
  reporter: Reporter,
  resetCache?: boolean,
};

/* 1 day */
const GARBAGE_COLLECTION_PERIOD = 24 * 60 * 60 * 1000;
/* 4 days */
const CACHE_FILE_MAX_LAST_ACCESS_TIME = GARBAGE_COLLECTION_PERIOD * 4;
/**
 * Temporary folder is cleaned up only on boot, ex. on OS X, as far as I'm
 * concerned. Since generally people reboot only very rarely, we need to clean
 * up old stuff from time to time.
 *
 * This code should be safe even if two different React Native projects are
 * running at the same time.
 */
const GARBAGE_COLLECTOR = new (class GarbageCollector {

  _lastCollected: ?number;
  _cacheWasReset: boolean;

  constructor() {
    this._cacheWasReset = false;
  }

  /**
   * We want to avoid preventing tool use if the cleanup fails for some reason,
   * but still provide some chance for people to report/fix things.
   */
  _collectSyncNoThrow() {
    try {
      collectCacheIfOldSync();
    } catch (error) {
      terminal.log(error.stack);
      terminal.log(
        'Error: Cleaning up the cache folder failed. Continuing anyway.',
      );
      terminal.log('The cache folder is: %s', getCacheDirPath());
    }
    this._lastCollected = Date.now();
  }

  _resetCache(reporter: Reporter) {
    rimraf.sync(getCacheDirPath());
    reporter.update({type: 'transform_cache_reset'});
    this._cacheWasReset = true;
    this._lastCollected = Date.now();
  }

  collectIfNecessarySync(options: CacheOptions) {
    if (options.resetCache && !this._cacheWasReset) {
      this._resetCache(options.reporter);
      return;
    }
    const lastCollected = this._lastCollected;
    if (
      lastCollected == null ||
      Date.now() - lastCollected > GARBAGE_COLLECTION_PERIOD
    ) {
      this._collectSyncNoThrow();
    }
  }

})();

/**
 * When restarting packager we want to avoid running the collection over again, so we store
 * the last collection time in a file and we check that first.
 */
function collectCacheIfOldSync() {
  const cacheDirPath = getCacheDirPath();
  mkdirp.sync(cacheDirPath);
  const cacheCollectionFilePath = path.join(cacheDirPath, 'last_collected');
  const lastCollected = Number.parseInt(tryReadFileSync(cacheCollectionFilePath, 'utf8'), 10);
  if (Number.isInteger(lastCollected) && Date.now() - lastCollected > GARBAGE_COLLECTION_PERIOD) {
    return;
  }
  const effectiveCacheDirPath = path.join(cacheDirPath, CACHE_SUB_DIR);
  mkdirp.sync(effectiveCacheDirPath);
  collectCacheSync(effectiveCacheDirPath);
  fs.writeFileSync(cacheCollectionFilePath, Date.now().toString());
}

/**
 * Remove all the cache files from the specified folder that are older than a certain duration.
 */
function collectCacheSync(dirPath: string) {
  const prefixDirs = fs.readdirSync(dirPath);
  for (let i = 0; i < prefixDirs.length; ++i) {
    const prefixDir = path.join(dirPath, prefixDirs[i]);
    const cacheFileNames = fs.readdirSync(prefixDir);
    for (let j = 0; j < cacheFileNames.length; ++j) {
      const cacheFilePath = path.join(prefixDir, cacheFileNames[j]);
      const stats = fs.lstatSync(cacheFilePath);
      const timeSinceLastAccess = Date.now() - stats.atime.getTime();
      if (
        stats.isFile() &&
        timeSinceLastAccess > CACHE_FILE_MAX_LAST_ACCESS_TIME
      ) {
        fs.unlinkSync(cacheFilePath);
      }
    }
  }
}

function tryReadFileSync(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    return '';
  }
}

function readMetadataFileSync(
  metadataFilePath: string,
): ?{
  cachedResultHash: string,
  cachedSourceHash: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  sourceMap: ?MappingsMap,
} {
  const metadataStr = fs.readFileSync(metadataFilePath, 'utf8');
  let metadata;
  try {
    metadata = JSON.parse(metadataStr);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
  if (!Array.isArray(metadata)) {
    return null;
  }
  const [
    cachedResultHash,
    cachedSourceHash,
    dependencies,
    dependencyOffsets,
    sourceMap,
  ] = metadata;
  if (
    typeof cachedResultHash !== 'string' ||
    typeof cachedSourceHash !== 'string' ||
    !(
      Array.isArray(dependencies) &&
      dependencies.every(dep => typeof dep === 'string')
    ) ||
    !(
      Array.isArray(dependencyOffsets) &&
      dependencyOffsets.every(offset => typeof offset === 'number')
    ) ||
    !(sourceMap == null || typeof sourceMap === 'object')
  ) {
    return null;
  }
  return {
    cachedResultHash,
    cachedSourceHash,
    dependencies,
    dependencyOffsets,
    sourceMap,
  };
}

export type ReadTransformProps = {
  filePath: string,
  sourceCode: string,
  transformOptions: WorkerOptions,
  transformOptionsKey: string,
  getTransformCacheKey: GetTransformCacheKey,
  cacheOptions: CacheOptions,
};

const EMPTY_ARRAY = [];

/**
 * We verify the source hash matches to ensure we always favor rebuilding when
 * source change (rather than just using fs.mtime(), a bit less robust).
 *
 * That means when the source changes, we override the old transformed code with
 * the new one. This is, I believe, preferable, so as to avoid bloating the
 * cache during development cycles, where people changes files all the time.
 * If we implement a global cache ability at some point, we'll be able to store
 * old artifacts as well.
 *
 * Meanwhile we store transforms with different options in different files so
 * that it is fast to switch between ex. minified, or not.
 */
function readSync(props: ReadTransformProps): TransformCacheResult {
  GARBAGE_COLLECTOR.collectIfNecessarySync(props.cacheOptions);
  const cacheFilePaths = getCacheFilePaths(props);
  let metadata, transformedCode;
  try {
    metadata = readMetadataFileSync(cacheFilePaths.metadata);
    if (metadata == null) {
      return {result: null, outdatedDependencies: EMPTY_ARRAY};
    }
    const sourceHash = hashSourceCode(props);
    if (sourceHash !== metadata.cachedSourceHash) {
      return {result: null, outdatedDependencies: metadata.dependencies};
    }
    transformedCode = fs.readFileSync(cacheFilePaths.transformedCode, 'utf8');
    const codeHash = crypto.createHash('sha1').update(transformedCode).digest('hex');
    if (metadata.cachedResultHash !== codeHash) {
      return {result: null, outdatedDependencies: metadata.dependencies};
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {result: null, outdatedDependencies: EMPTY_ARRAY};
    }
    throw error;
  }
  return {
    result: {
      code: transformedCode,
      dependencies: metadata.dependencies,
      dependencyOffsets: metadata.dependencyOffsets,
      map: metadata.sourceMap,
    },
    outdatedDependencies: EMPTY_ARRAY,
  };
}

module.exports = {
  writeSync,
  readSync(props: ReadTransformProps): TransformCacheResult {
    const result = readSync(props);
    const msg = result ? 'Cache hit: ' : 'Cache miss: ';
    debugRead(msg + props.filePath);
    return result;
  },
};
