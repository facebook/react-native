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

const fs = require('fs');
/**
 * We get the package "for free" with "write-file-atomic". MurmurHash3 is a
 * faster hash, but non-cryptographic and insecure, that seems reasonnable for
 * this particular use case.
 */
const imurmurhash = require('imurmurhash');
const jsonStableStringify = require('json-stable-stringify');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const writeFileAtomicSync = require('write-file-atomic').sync;

const CACHE_NAME = 'react-native-packager-cache';

type CacheFilePaths = {transformedCode: string, metadata: string};

/**
 * If packager is running for two different directories, we don't want the
 * caches to conflict with each other. `__dirname` carries that because packager
 * will be, for example, installed in a different `node_modules/` folder for
 * different projects.
 */
const getCacheDirPath = (function () {
  let dirPath;
  return function () {
    if (dirPath == null) {
      dirPath = path.join(
        require('os').tmpdir(),
        CACHE_NAME + '-' + imurmurhash(__dirname).result().toString(16),
      );
    }
    return dirPath;
  };
})();

function hashSourceCode(props: {
  sourceCode: string,
  transformCacheKey: string,
}): string {
  return imurmurhash(props.transformCacheKey).hash(props.sourceCode).result();
}

/**
 * The path, built as a hash, does not take the source code itself into account
 * because it would generate lots of file during development. (The source hash
 * is stored in the metadata instead).
 */
function getCacheFilePaths(props: {
  filePath: string,
  transformOptions: mixed,
}): CacheFilePaths {
  const hasher = imurmurhash()
    .hash(props.filePath)
    .hash(jsonStableStringify(props.transformOptions) || '');
  let hash = hasher.result().toString(16);
  hash = Array(8 - hash.length + 1).join('0') + hash;
  const prefix = hash.substr(0, 2);
  const fileName = `${hash.substr(2)}${path.basename(props.filePath)}`;
  const base = path.join(getCacheDirPath(), prefix, fileName);
  return {transformedCode: base, metadata: base + '.meta'};
}

type CachedResult = {
  code: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  map?: ?{},
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
  transformCacheKey: string,
  transformOptions: mixed,
  result: CachedResult,
}): void {
  const cacheFilePath = getCacheFilePaths(props);
  mkdirp.sync(path.dirname(cacheFilePath.transformedCode));
  const {result} = props;
  unlinkIfExistsSync(cacheFilePath.transformedCode);
  unlinkIfExistsSync(cacheFilePath.metadata);
  writeFileAtomicSync(cacheFilePath.transformedCode, result.code);
  writeFileAtomicSync(cacheFilePath.metadata, JSON.stringify([
    imurmurhash(result.code).result(),
    hashSourceCode(props),
    result.dependencies,
    result.dependencyOffsets,
    result.map,
  ]));
}

type CacheOptions = {resetCache?: boolean};

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
      console.error(error.stack);
      console.error(
        'Error: Cleaning up the cache folder failed. Continuing anyway.',
      );
      console.error('The cache folder is: %s', getCacheDirPath());
    }
    this._lastCollected = Date.now();
  }

  _resetCache() {
    rimraf.sync(getCacheDirPath());
    console.log('Warning: The transform cache was reset.');
    this._cacheWasReset = true;
    this._lastCollected = Date.now();
  }

  collectIfNecessarySync(options: CacheOptions) {
    if (options.resetCache && !this._cacheWasReset) {
      this._resetCache();
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
  cachedResultHash: number,
  cachedSourceHash: number,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  sourceMap: ?{},
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
    typeof cachedResultHash !== 'number' ||
    typeof cachedSourceHash !== 'number' ||
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
function readSync(props: {
  filePath: string,
  sourceCode: string,
  transformOptions: mixed,
  transformCacheKey: string,
  cacheOptions: CacheOptions,
}): ?CachedResult {
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
    if (metadata.cachedResultHash !== imurmurhash(transformedCode).result()) {
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
  readSync,
};
