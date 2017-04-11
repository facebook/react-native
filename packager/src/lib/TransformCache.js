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

const CACHE_NAME = 'react-native-packager-cache';

import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {SourceMap} from './SourceMap';
import type {Reporter} from './reporting';

type CacheFilePaths = {transformedCode: string, metadata: string};
export type GetTransformCacheKey = (sourceCode: string, filename: string, options: {}) => string;

/**
 * If packager is running for two different directories, we don't want the
 * caches to conflict with each other. `__dirname` carries that because packager
 * will be, for example, installed in a different `node_modules/` folder for
 * different projects.
 */
const getCacheDirPath = (function() {
  let dirPath;
  return function() {
    if (dirPath == null) {
      dirPath = path.join(
        require('os').tmpdir(),
        CACHE_NAME + '-' + crypto.createHash('sha1')
          .update(__dirname).digest('base64'),
      );
      require('debug')('RNP:TransformCache:Dir')(
        `transform cache directory: ${dirPath}`
      );
    }
    return dirPath;
  };
})();

function hashSourceCode(props: {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: TransformOptions,
  transformOptionsKey: string,
}): string {
  return crypto.createHash('sha1')
    .update(props.getTransformCacheKey(
      props.sourceCode,
      props.filePath,
      props.transformOptions,
    ))
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
  const base = path.join(getCacheDirPath(), prefix, fileName);
  return {transformedCode: base, metadata: base + '.meta'};
}

export type CachedResult = {
  code: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  map?: ?SourceMap,
};

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
  transformOptions: TransformOptions,
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

  _collectSync() {
    const cacheDirPath = getCacheDirPath();
    mkdirp.sync(cacheDirPath);
    const prefixDirs = fs.readdirSync(cacheDirPath);
    for (let i = 0; i < prefixDirs.length; ++i) {
      const prefixDir = path.join(cacheDirPath, prefixDirs[i]);
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

  /**
   * We want to avoid preventing tool use if the cleanup fails for some reason,
   * but still provide some chance for people to report/fix things.
   */
  _collectSyncNoThrow() {
    try {
      this._collectSync();
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

function readMetadataFileSync(
  metadataFilePath: string,
): ?{
  cachedResultHash: string,
  cachedSourceHash: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  sourceMap: ?SourceMap,
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
  transformOptions: TransformOptions,
  transformOptionsKey: string,
  getTransformCacheKey: GetTransformCacheKey,
  cacheOptions: CacheOptions,
};

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
function readSync(props: ReadTransformProps): ?CachedResult {
  GARBAGE_COLLECTOR.collectIfNecessarySync(props.cacheOptions);
  const cacheFilePaths = getCacheFilePaths(props);
  let metadata, transformedCode;
  try {
    metadata = readMetadataFileSync(cacheFilePaths.metadata);
    if (metadata == null) {
      return null;
    }
    const sourceHash = hashSourceCode(props);
    if (sourceHash !== metadata.cachedSourceHash) {
      return null;
    }
    transformedCode = fs.readFileSync(cacheFilePaths.transformedCode, 'utf8');
    const codeHash = crypto.createHash('sha1').update(transformedCode).digest('hex');
    if (metadata.cachedResultHash !== codeHash) {
      return null;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
  return {
    code: transformedCode,
    dependencies: metadata.dependencies,
    dependencyOffsets: metadata.dependencyOffsets,
    map: metadata.sourceMap,
  };
}

module.exports = {
  writeSync,
  readSync(props: ReadTransformProps): ?CachedResult {
    const result = readSync(props);
    const msg = result ? 'Cache hit: ' : 'Cache miss: ';
    debugRead(msg + props.filePath);
    return result;
  },
};
