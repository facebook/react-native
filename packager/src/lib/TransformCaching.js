/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const crypto = require('crypto');
const debugRead = require('debug')('RNP:TransformCache:Read');
const fs = require('fs');
const invariant = require('fbjs/lib/invariant');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const writeFileAtomicSync = require('write-file-atomic').sync;

import type {Options as WorkerOptions} from '../JSTransformer/worker';
import type {MappingsMap} from './SourceMap';
import type {Reporter} from './reporting';
import type {LocalPath} from '../node-haste/lib/toLocalPath';

type CacheFilePaths = {transformedCode: string, metadata: string};
export type GetTransformCacheKey = (options: {}) => string;

const CACHE_SUB_DIR = 'cache';

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

export type CacheOptions = {
  reporter: Reporter,
  resetCache?: boolean,
};

export type ReadTransformProps = {
  filePath: string,
  localPath: LocalPath,
  sourceCode: string,
  transformOptions: WorkerOptions,
  transformOptionsKey: string,
  getTransformCacheKey: GetTransformCacheKey,
  cacheOptions: CacheOptions,
};

type WriteTransformProps = {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: WorkerOptions,
  transformOptionsKey: string,
  result: CachedResult,
};

/**
 * The API that should be exposed for a transform cache.
 */
export type TransformCache = {
  writeSync(props: WriteTransformProps): void,
  readSync(props: ReadTransformProps): TransformCacheResult,
};

const EMPTY_ARRAY = [];

/* 1 day */
const GARBAGE_COLLECTION_PERIOD = 24 * 60 * 60 * 1000;
/* 4 days */
const CACHE_FILE_MAX_LAST_ACCESS_TIME = GARBAGE_COLLECTION_PERIOD * 4;

class FileBasedCache {
  _cacheWasReset: boolean;
  _lastCollected: ?number;
  _rootPath: string;

  /**
   * The root path is where the data will be stored. It shouldn't contain
   * other files other than the cache's own files, so it should start empty
   * when the packager is first run. When doing a cache reset, it may be
   * completely deleted.
   */
  constructor(rootPath: string) {
    this._cacheWasReset = false;
    invariant(
      path.isAbsolute(rootPath),
      'root path of the transform cache must be absolute',
    );
    require('debug')('RNP:TransformCache:Dir')(
      `transform cache directory: ${rootPath}`,
    );
    this._rootPath = rootPath;
  }

  /**
   * We store the transformed JS because it is likely to be much bigger than the
   * rest of the data JSON. Probably the map should be stored separately as
   * well.
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
  writeSync(props: {
    filePath: string,
    sourceCode: string,
    getTransformCacheKey: GetTransformCacheKey,
    transformOptions: WorkerOptions,
    transformOptionsKey: string,
    result: CachedResult,
  }): void {
    const cacheFilePath = this._getCacheFilePaths(props);
    mkdirp.sync(path.dirname(cacheFilePath.transformedCode));
    const {result} = props;
    unlinkIfExistsSync(cacheFilePath.transformedCode);
    unlinkIfExistsSync(cacheFilePath.metadata);
    writeFileAtomicSync(cacheFilePath.transformedCode, result.code);
    writeFileAtomicSync(
      cacheFilePath.metadata,
      JSON.stringify([
        crypto.createHash('sha1').update(result.code).digest('hex'),
        hashSourceCode(props),
        result.dependencies,
        result.dependencyOffsets,
        result.map,
      ]),
    );
  }

  readSync(props: ReadTransformProps): TransformCacheResult {
    const result = this._readSync(props);
    const msg = result ? 'Cache hit: ' : 'Cache miss: ';
    debugRead(msg + props.filePath);
    return result;
  }

  /**
   * We verify the source hash matches to ensure we always favor rebuilding when
   * source change (rather than just using fs.mtime(), a bit less robust).
   *
   * That means when the source changes, we override the old transformed code
   * with the new one. This is, I believe, preferable, so as to avoid bloating
   * the cache during development cycles, where people changes files all the
   * time. If we implement a global cache ability at some point, we'll be able
   * to store old artifacts as well.
   *
   * Meanwhile we store transforms with different options in different files so
   * that it is fast to switch between ex. minified, or not.
   */
  _readSync(props: ReadTransformProps): TransformCacheResult {
    this._collectIfNecessarySync(props.cacheOptions);
    try {
      return this._readFilesSync(props);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {result: null, outdatedDependencies: EMPTY_ARRAY};
      }
      throw error;
    }
  }

  _readFilesSync(props: ReadTransformProps): TransformCacheResult {
    const cacheFilePaths = this._getCacheFilePaths(props);
    const metadata = readMetadataFileSync(cacheFilePaths.metadata);
    if (metadata == null) {
      return {result: null, outdatedDependencies: EMPTY_ARRAY};
    }
    const sourceHash = hashSourceCode(props);
    if (sourceHash !== metadata.cachedSourceHash) {
      return {result: null, outdatedDependencies: metadata.dependencies};
    }
    const transformedCode = fs.readFileSync(
      cacheFilePaths.transformedCode,
      'utf8',
    );
    const codeHash = crypto
      .createHash('sha1')
      .update(transformedCode)
      .digest('hex');
    if (metadata.cachedResultHash !== codeHash) {
      return {result: null, outdatedDependencies: metadata.dependencies};
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

  /**
   * Temporary folder is never cleaned up automatically, we need to clean up old
   * stuff ourselves. This code should be safe even if two different React
   * Native projects are running at the same time.
   */
  _collectIfNecessarySync(options: CacheOptions) {
    if (options.resetCache && !this._cacheWasReset) {
      this._resetCache(options.reporter);
      return;
    }
    const lastCollected = this._lastCollected;
    if (
      lastCollected == null ||
      Date.now() - lastCollected > GARBAGE_COLLECTION_PERIOD
    ) {
      this._collectSyncNoThrow(options.reporter);
    }
  }

  _resetCache(reporter: Reporter) {
    rimraf.sync(this._rootPath);
    reporter.update({type: 'transform_cache_reset'});
    this._cacheWasReset = true;
    this._lastCollected = Date.now();
  }

  /**
   * We want to avoid preventing tool use if the cleanup fails for some reason,
   * but still provide some chance for people to report/fix things.
   */
  _collectSyncNoThrow(reporter: Reporter) {
    try {
      this._collectCacheIfOldSync();
    } catch (error) {
      // FIXME: $FlowFixMe: this is a hack, only works for TerminalReporter
      const {terminal} = reporter;
      if (terminal != null) {
        terminal.log(error.stack);
        terminal.log(
          'Error: Cleaning up the cache folder failed. Continuing anyway.',
        );
        terminal.log('The cache folder is: %s', this._rootPath);
      }
    }
    this._lastCollected = Date.now();
  }

  /**
   * When restarting packager we want to avoid running the collection over
   * again, so we store the last collection time in a file and we check that
   * first.
   */
  _collectCacheIfOldSync() {
    const cacheDirPath = this._rootPath;
    mkdirp.sync(cacheDirPath);
    const cacheCollectionFilePath = path.join(cacheDirPath, 'last_collected');
    const lastCollected = Number.parseInt(
      tryReadFileSync(cacheCollectionFilePath),
      10,
    );
    if (
      Number.isInteger(lastCollected) &&
      Date.now() - lastCollected > GARBAGE_COLLECTION_PERIOD
    ) {
      return;
    }
    const effectiveCacheDirPath = path.join(cacheDirPath, CACHE_SUB_DIR);
    mkdirp.sync(effectiveCacheDirPath);
    collectCacheSync(effectiveCacheDirPath);
    fs.writeFileSync(cacheCollectionFilePath, Date.now().toString());
  }

  /**
   * The path, built as a hash, does not take the source code itself into
   * account because it would generate lots of file during development. (The
   * source hash is stored in the metadata instead).
   */
  _getCacheFilePaths(props: {
    filePath: string,
    transformOptionsKey: string,
  }): CacheFilePaths {
    const hasher = crypto
      .createHash('sha1')
      .update(props.filePath)
      .update(props.transformOptionsKey);
    const hash = hasher.digest('hex');
    const prefix = hash.substr(0, 2);
    const fileName = `${hash.substr(2)}`;
    const base = path.join(this._rootPath, CACHE_SUB_DIR, prefix, fileName);
    return {transformedCode: base, metadata: base + '.meta'};
  }
}

/**
 * Remove all the cache files from the specified folder that are older than a
 * certain duration.
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
  const metadata = tryParseJSON(metadataStr);
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
    !(Array.isArray(dependencies) &&
      dependencies.every(dep => typeof dep === 'string')) ||
    !(Array.isArray(dependencyOffsets) &&
      dependencyOffsets.every(offset => typeof offset === 'number')) ||
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

function tryParseJSON(str: string): any {
  try {
    return JSON.parse(str);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function hashSourceCode(props: {
  filePath: string,
  sourceCode: string,
  getTransformCacheKey: GetTransformCacheKey,
  transformOptions: WorkerOptions,
  transformOptionsKey: string,
}): string {
  return crypto
    .createHash('sha1')
    .update(props.getTransformCacheKey(props.transformOptions))
    .update(props.sourceCode)
    .digest('hex');
}

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
 * In some context we want to build from scratch, that is what this cache
 * implementation allows.
 */
function none(): TransformCache {
  return {
    writeSync: () => {},
    readSync: () => ({
      result: null,
      outdatedDependencies: [],
    }),
  };
}

/**
 * If packager is running for two different directories, we don't want the
 * caches to conflict with each other. `__dirname` carries that because
 * packager will be, for example, installed in a different `node_modules/`
 * folder for different projects.
 */
function useTempDir(): TransformCache {
  const hash = crypto.createHash('sha1').update(__dirname);
  if (process.getuid != null) {
    hash.update(process.getuid().toString());
  }
  const tmpDir = require('os').tmpdir();
  const cacheName = 'react-native-packager-cache';
  const rootPath = path.join(tmpDir, cacheName + '-' + hash.digest('hex'));
  return new FileBasedCache(rootPath);
}

function useProjectDir(projectPath: string): TransformCache {
  invariant(path.isAbsolute(projectPath), 'project path must be absolute');
  return new FileBasedCache(path.join(projectPath, '.metro-bundler'));
}

module.exports = {FileBasedCache, none, useTempDir, useProjectDir};
