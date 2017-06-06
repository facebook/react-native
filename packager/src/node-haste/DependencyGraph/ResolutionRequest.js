/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

const AsyncTaskGroup = require('../lib/AsyncTaskGroup');
const FileNameResolver = require('./FileNameResolver');
const MapWithDefaults = require('../lib/MapWithDefaults');

const debug = require('debug')('RNP:DependencyGraph');
const util = require('util');
const path = require('path');
const realPath = require('path');
const invariant = require('fbjs/lib/invariant');
const isAbsolutePath = require('absolute-path');

import type {HasteFS} from '../types';
import type DependencyGraphHelpers from './DependencyGraphHelpers';
import type ResolutionResponse from './ResolutionResponse';
import type {
  Options as TransformWorkerOptions,
} from '../../JSTransformer/worker';
import type {ReadResult, CachedReadResult} from '../Module';

type DirExistsFn = (filePath: string) => boolean;

/**
 * `jest-haste-map`'s interface for ModuleMap.
 */
export type ModuleMap = {
  getModule(
    name: string,
    platform: ?string,
    supportsNativePlatform: boolean,
  ): ?string,
  getPackage(
    name: string,
    platform: ?string,
    supportsNativePlatform: boolean,
  ): ?string,
};

export type Packageish = {
  isHaste(): boolean,
  getName(): Promise<string>,
  path: string,
  redirectRequire(toModuleName: string): string | false,
  getMain(): string,
  +root: string,
};

export type Moduleish = {
  +path: string,
  isHaste(): boolean,
  getName(): Promise<string>,
  getPackage(): ?Packageish,
  hash(): string,
  readCached(transformOptions: TransformWorkerOptions): CachedReadResult,
  readFresh(transformOptions: TransformWorkerOptions): Promise<ReadResult>,
};

export type ModuleishCache<TModule, TPackage> = {
  getPackage(
    name: string,
    platform?: string,
    supportsNativePlatform?: boolean,
  ): TPackage,
  getModule(path: string): TModule,
  getAssetModule(path: string): TModule,
};

type Options<TModule, TPackage> = {|
  +dirExists: DirExistsFn,
  +entryPath: string,
  +extraNodeModules: ?Object,
  +hasteFS: HasteFS,
  +helpers: DependencyGraphHelpers,
  +moduleCache: ModuleishCache<TModule, TPackage>,
  +moduleMap: ModuleMap,
  +platform: ?string,
  +preferNativePlatform: boolean,
  +resolveAsset: (dirPath: string, assetName: string) => $ReadOnlyArray<string>,
  +sourceExts: Array<string>,
|};

/**
 * This is a way to describe what files we tried to look for when resolving
 * a module name as file. This is mainly used for error reporting, so that
 * we can explain why we cannot resolve a module.
 */
type FileCandidates =
  // We only tried to resolve a specific asset.
  | {|+type: 'asset', +name: string|}
  // We attempted to resolve a name as being a source file (ex. JavaScript,
  // JSON...), in which case there can be several variants we tried, for
  // example `foo.ios.js`, `foo.js`, etc.
  | {|+type: 'sources', +fileNames: $ReadOnlyArray<string>|};

/**
 * This is a way to describe what files we tried to look for when resolving
 * a module name as directory.
 */
type DirCandidates =
  | {|+type: 'package', +dir: DirCandidates, +file: FileCandidates|}
  | {|+type: 'index', +file: FileCandidates|};

type Resolution<TModule, TCandidates> =
  | {|+type: 'resolved', +module: TModule|}
  | {|+type: 'failed', +candidates: TCandidates|};

/**
 * It may not be a great pattern to leverage exception just for "trying" things
 * out, notably for performance. We should consider replacing these functions
 * to be nullable-returning, or being better stucture to the algorithm.
 */
function tryResolveSync<T>(action: () => T, secondaryAction: () => T): T {
  try {
    return action();
  } catch (error) {
    if (error.type !== 'UnableToResolveError') {
      throw error;
    }
    return secondaryAction();
  }
}

class ResolutionRequest<TModule: Moduleish, TPackage: Packageish> {
  _doesFileExist = filePath => this._options.hasteFS.exists(filePath);
  _immediateResolutionCache: {[key: string]: TModule};
  _options: Options<TModule, TPackage>;

  static EMPTY_MODULE: string = require.resolve('./assets/empty-module.js');

  constructor(options: Options<TModule, TPackage>) {
    this._options = options;
    this._resetResolutionCache();
  }

  _tryResolve<T>(
    action: () => Promise<T>,
    secondaryAction: () => ?Promise<T>,
  ): Promise<T> {
    return action().catch(error => {
      if (error.type !== 'UnableToResolveError') {
        throw error;
      }
      return secondaryAction();
    });
  }

  resolveDependency(fromModule: TModule, toModuleName: string): TModule {
    const resHash = resolutionHash(fromModule.path, toModuleName);

    const immediateResolution = this._immediateResolutionCache[resHash];
    if (immediateResolution) {
      return immediateResolution;
    }

    const cacheResult = result => {
      this._immediateResolutionCache[resHash] = result;
      return result;
    };

    if (
      !this._options.helpers.isNodeModulesDir(fromModule.path) &&
      !(isRelativeImport(toModuleName) || isAbsolutePath(toModuleName))
    ) {
      const result = tryResolveSync(
        () => this._resolveHasteDependency(fromModule, toModuleName),
        () => this._resolveNodeDependency(fromModule, toModuleName),
      );
      return cacheResult(result);
    }

    return cacheResult(this._resolveNodeDependency(fromModule, toModuleName));
  }

  resolveModuleDependencies(
    module: TModule,
    dependencyNames: $ReadOnlyArray<string>,
  ): [$ReadOnlyArray<string>, $ReadOnlyArray<TModule>] {
    const dependencies = dependencyNames.map(name =>
      this.resolveDependency(module, name),
    );
    return [dependencyNames, dependencies];
  }

  getOrderedDependencies<T>({
    response,
    transformOptions,
    onProgress,
    recursive = true,
  }: {
    response: ResolutionResponse<TModule, T>,
    transformOptions: TransformWorkerOptions,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
    recursive: boolean,
  }) {
    const entry = this._options.moduleCache.getModule(this._options.entryPath);

    response.pushDependency(entry);
    let totalModules = 1;
    let finishedModules = 0;

    let preprocessedModuleCount = 1;
    if (recursive) {
      this._preprocessPotentialDependencies(transformOptions, entry, count => {
        if (count + 1 <= preprocessedModuleCount) {
          return;
        }
        preprocessedModuleCount = count + 1;
        if (onProgress != null) {
          onProgress(finishedModules, preprocessedModuleCount);
        }
      });
    }

    const resolveDependencies = (module: TModule) =>
      Promise.resolve().then(() => {
        const cached = module.readCached(transformOptions);
        if (cached.result != null) {
          return this.resolveModuleDependencies(
            module,
            cached.result.dependencies,
          );
        }
        return module
          .readFresh(transformOptions)
          .then(({dependencies}) =>
            this.resolveModuleDependencies(module, dependencies),
          );
      });

    const collectedDependencies: MapWithDefaults<
      TModule,
      Promise<Array<TModule>>,
    > = new MapWithDefaults(module => collect(module));
    const crawlDependencies = (mod, [depNames, dependencies]) => {
      const filteredPairs = [];

      dependencies.forEach((modDep, i) => {
        const name = depNames[i];
        if (modDep == null) {
          debug(
            'WARNING: Cannot find required module `%s` from module `%s`',
            name,
            mod.path,
          );
          return false;
        }
        return filteredPairs.push([name, modDep]);
      });

      response.setResolvedDependencyPairs(mod, filteredPairs);

      const dependencyModules = filteredPairs.map(([, m]) => m);
      const newDependencies = dependencyModules.filter(
        m => !collectedDependencies.has(m),
      );

      if (onProgress) {
        finishedModules += 1;
        totalModules += newDependencies.length;
        onProgress(
          finishedModules,
          Math.max(totalModules, preprocessedModuleCount),
        );
      }

      if (recursive) {
        // doesn't block the return of this function invocation, but defers
        // the resulution of collectionsInProgress.done.then(...)
        dependencyModules.forEach(dependency =>
          collectedDependencies.get(dependency),
        );
      }
      return dependencyModules;
    };

    const collectionsInProgress = new AsyncTaskGroup();
    function collect(module) {
      collectionsInProgress.start(module);
      const result = resolveDependencies(module).then(deps =>
        crawlDependencies(module, deps),
      );
      const end = () => collectionsInProgress.end(module);
      result.then(end, end);
      return result;
    }

    function resolveKeyWithPromise(
      [key: TModule, promise: Promise<Array<TModule>>],
    ): Promise<[TModule, Array<TModule>]> {
      return promise.then(value => [key, value]);
    }

    return Promise.all([
      // kicks off recursive dependency discovery, but doesn't block until it's
      // done
      collectedDependencies.get(entry),

      // resolves when there are no more modules resolving dependencies
      collectionsInProgress.done,
    ])
      .then(([rootDependencies]) => {
        return Promise.all(
          Array.from(collectedDependencies, resolveKeyWithPromise),
        ).then(moduleToDependenciesPairs => [
          rootDependencies,
          new MapWithDefaults(() => [], moduleToDependenciesPairs),
        ]);
      })
      .then(([rootDependencies, moduleDependencies]) => {
        // serialize dependencies, and make sure that every single one is only
        // included once
        const seen = new Set([entry]);
        function traverse(dependencies) {
          dependencies.forEach(dependency => {
            if (seen.has(dependency)) {
              return;
            }

            seen.add(dependency);
            response.pushDependency(dependency);
            traverse(moduleDependencies.get(dependency));
          });
        }

        traverse(rootDependencies);
      });
  }

  /**
   * This synchronously look at all the specified modules and recursively kicks
   * off global cache fetching or transforming (via `readFresh`). This is a hack
   * that workaround the current structure, because we could do better. First
   * off, the algorithm that resolves dependencies recursively should be
   * synchronous itself until it cannot progress anymore (and needs to call
   * `readFresh`), so that this algo would be integrated into it.
   */
  _preprocessPotentialDependencies(
    transformOptions: TransformWorkerOptions,
    module: TModule,
    onProgress: (moduleCount: number) => mixed,
  ): void {
    const visitedModulePaths = new Set();
    const pendingBatches = [
      this.preprocessModule(transformOptions, module, visitedModulePaths),
    ];
    onProgress(visitedModulePaths.size);
    while (pendingBatches.length > 0) {
      const dependencyModules = pendingBatches.pop();
      while (dependencyModules.length > 0) {
        const dependencyModule = dependencyModules.pop();
        const deps = this.preprocessModule(
          transformOptions,
          dependencyModule,
          visitedModulePaths,
        );
        pendingBatches.push(deps);
        onProgress(visitedModulePaths.size);
      }
    }
  }

  preprocessModule(
    transformOptions: TransformWorkerOptions,
    module: TModule,
    visitedModulePaths: Set<string>,
  ): Array<TModule> {
    const cached = module.readCached(transformOptions);
    if (cached.result == null) {
      module.readFresh(transformOptions).catch(error => {
        /* ignore errors, they'll be handled later if the dependency is actually
         * not obsolete, and required from somewhere */
      });
    }
    const dependencies = cached.result != null
      ? cached.result.dependencies
      : cached.outdatedDependencies;
    return this.tryResolveModuleDependencies(
      module,
      dependencies,
      visitedModulePaths,
    );
  }

  tryResolveModuleDependencies(
    module: TModule,
    dependencyNames: $ReadOnlyArray<string>,
    visitedModulePaths: Set<string>,
  ): Array<TModule> {
    const result = [];
    for (let i = 0; i < dependencyNames.length; ++i) {
      try {
        const depModule = this.resolveDependency(module, dependencyNames[i]);
        if (!visitedModulePaths.has(depModule.path)) {
          visitedModulePaths.add(depModule.path);
          result.push(depModule);
        }
      } catch (error) {
        if (!(error instanceof UnableToResolveError)) {
          throw error;
        }
      }
    }
    return result;
  }

  _resolveHasteDependency(fromModule: TModule, toModuleName: string): TModule {
    toModuleName = normalizePath(toModuleName);

    const pck = fromModule.getPackage();
    let realModuleName;
    if (pck) {
      /* $FlowFixMe: redirectRequire can actually return `false` for
         exclusions*/
      realModuleName = (pck.redirectRequire(toModuleName): string);
    } else {
      realModuleName = toModuleName;
    }

    const modulePath = this._options.moduleMap.getModule(
      realModuleName,
      this._options.platform,
      /* supportsNativePlatform */ true,
    );
    if (modulePath != null) {
      const module = this._options.moduleCache.getModule(modulePath);
      /* temporary until we strengthen the typing */
      invariant(module.type === 'Module', 'expected Module type');
      return module;
    }

    let packageName = realModuleName;
    let packagePath;
    while (packageName && packageName !== '.') {
      packagePath = this._options.moduleMap.getPackage(
        packageName,
        this._options.platform,
        /* supportsNativePlatform */ true,
      );
      if (packagePath != null) {
        break;
      }
      packageName = path.dirname(packageName);
    }

    if (packagePath != null) {
      const package_ = this._options.moduleCache.getPackage(packagePath);
      /* temporary until we strengthen the typing */
      invariant(package_.type === 'Package', 'expected Package type');

      const potentialModulePath = path.join(
        package_.root,
        path.relative(packageName, realModuleName),
      );
      return tryResolveSync(
        () =>
          this._loadAsFileOrThrow(
            potentialModulePath,
            fromModule,
            toModuleName,
          ),
        () =>
          this._loadAsDirOrThrow(potentialModulePath, fromModule, toModuleName),
      );
    }

    throw new UnableToResolveError(
      fromModule,
      toModuleName,
      'Unable to resolve dependency',
    );
  }

  _redirectRequire(fromModule: TModule, modulePath: string): string | false {
    const pck = fromModule.getPackage();
    if (pck) {
      return pck.redirectRequire(modulePath);
    }
    return modulePath;
  }

  _resolveFileOrDir(fromModule: TModule, toModuleName: string): TModule {
    const potentialModulePath = isAbsolutePath(toModuleName)
      ? resolveWindowsPath(toModuleName)
      : path.join(path.dirname(fromModule.path), toModuleName);

    const realModuleName = this._redirectRequire(
      fromModule,
      potentialModulePath,
    );
    if (realModuleName === false) {
      return this._getEmptyModule(fromModule, toModuleName);
    }

    return tryResolveSync(
      () => this._loadAsFileOrThrow(realModuleName, fromModule, toModuleName),
      () => this._loadAsDirOrThrow(realModuleName, fromModule, toModuleName),
    );
  }

  _resolveNodeDependency(fromModule: TModule, toModuleName: string): TModule {
    if (isRelativeImport(toModuleName) || isAbsolutePath(toModuleName)) {
      return this._resolveFileOrDir(fromModule, toModuleName);
    }
    const realModuleName = this._redirectRequire(fromModule, toModuleName);
    // exclude
    if (realModuleName === false) {
      return this._getEmptyModule(fromModule, toModuleName);
    }

    if (isRelativeImport(realModuleName) || isAbsolutePath(realModuleName)) {
      // derive absolute path /.../node_modules/fromModuleDir/realModuleName
      const fromModuleParentIdx =
        fromModule.path.lastIndexOf('node_modules' + path.sep) + 13;
      const fromModuleDir = fromModule.path.slice(
        0,
        fromModule.path.indexOf(path.sep, fromModuleParentIdx),
      );
      const absPath = path.join(fromModuleDir, realModuleName);
      return this._resolveFileOrDir(fromModule, absPath);
    }

    const searchQueue = [];
    for (
      let currDir = path.dirname(fromModule.path);
      currDir !== '.' && currDir !== realPath.parse(fromModule.path).root;
      currDir = path.dirname(currDir)
    ) {
      const searchPath = path.join(currDir, 'node_modules');
      searchQueue.push(path.join(searchPath, realModuleName));
    }

    const extraSearchQueue = [];
    if (this._options.extraNodeModules) {
      const {extraNodeModules} = this._options;
      const bits = toModuleName.split(path.sep);
      const packageName = bits[0];
      if (extraNodeModules[packageName]) {
        bits[0] = extraNodeModules[packageName];
        extraSearchQueue.push(path.join.apply(path, bits));
      }
    }

    const fullSearchQueue = searchQueue.concat(extraSearchQueue);
    for (let i = 0; i < fullSearchQueue.length; ++i) {
      const resolvedModule = this._tryResolveNodeDep(
        fullSearchQueue[i],
        fromModule,
        toModuleName,
      );
      if (resolvedModule != null) {
        return resolvedModule;
      }
    }

    const displaySearchQueue = searchQueue
      .filter(dirPath => this._options.dirExists(dirPath))
      .concat(extraSearchQueue);

    const hint = displaySearchQueue.length ? ' or in these directories:' : '';
    throw new UnableToResolveError(
      fromModule,
      toModuleName,
      `Module does not exist in the module map${hint}\n` +
        displaySearchQueue
          .map(searchPath => `  ${path.dirname(searchPath)}\n`)
          .join(', ') +
        '\n' +
        `This might be related to https://github.com/facebook/react-native/issues/4968\n` +
        `To resolve try the following:\n` +
        `  1. Clear watchman watches: \`watchman watch-del-all\`.\n` +
        `  2. Delete the \`node_modules\` folder: \`rm -rf node_modules && npm install\`.\n` +
        '  3. Reset packager cache: `rm -fr $TMPDIR/react-*` or `npm start -- --reset-cache`.',
    );
  }

  /**
   * This is written as a separate function because "try..catch" blocks cause
   * the entire surrounding function to be deoptimized.
   */
  _tryResolveNodeDep(
    searchPath: string,
    fromModule: TModule,
    toModuleName: string,
  ): ?TModule {
    try {
      return tryResolveSync(
        () => this._loadAsFileOrThrow(searchPath, fromModule, toModuleName),
        () => this._loadAsDirOrThrow(searchPath, fromModule, toModuleName),
      );
    } catch (error) {
      if (error.type !== 'UnableToResolveError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * Eventually we'd like to remove all the exception being throw in the middle
   * of the resolution algorithm, instead keeping track of tentatives in a
   * specific data structure, and building a proper error at the top-level.
   * This function is meant to be a temporary proxy for _loadAsFile until
   * the callsites switch to that tracking structure.
   */
  _loadAsFileOrThrow(
    basePath: string,
    fromModule: TModule,
    toModule: string,
  ): TModule {
    const dirPath = path.dirname(basePath);
    const fileNameHint = path.basename(basePath);
    const result = this._loadAsFile(dirPath, fileNameHint);
    if (result.type === 'resolved') {
      return result.module;
    }
    if (result.candidates.type === 'asset') {
      const msg =
        `Directory \`${dirPath}' doesn't contain asset ` +
        `\`${result.candidates.name}'`;
      throw new UnableToResolveError(fromModule, toModule, msg);
    }
    invariant(result.candidates.type === 'sources', 'invalid candidate type');
    const msg =
      `Could not resolve the base path \`${basePath}' into a module. The ` +
      `folder \`${dirPath}' was searched for one of these files: ` +
      result.candidates.fileNames.map(filePath => `\`${filePath}'`).join(', ') +
      '.';
    throw new UnableToResolveError(fromModule, toModule, msg);
  }

  _loadAsFile(
    dirPath: string,
    fileNameHint: string,
  ): Resolution<TModule, FileCandidates> {
    if (this._options.helpers.isAssetFile(fileNameHint)) {
      return this._loadAsAssetFile(dirPath, fileNameHint);
    }
    const doesFileExist = this._doesFileExist;
    const resolver = new FileNameResolver({doesFileExist, dirPath});
    const fileName = this._tryToResolveAllFileNames(resolver, fileNameHint);
    if (fileName != null) {
      const filePath = path.join(dirPath, fileName);
      const module = this._options.moduleCache.getModule(filePath);
      return {type: 'resolved', module};
    }
    const fileNames = resolver.getTentativeFileNames();
    return {type: 'failed', candidates: {type: 'sources', fileNames}};
  }

  _loadAsAssetFile(
    dirPath: string,
    fileNameHint: string,
  ): Resolution<TModule, FileCandidates> {
    const assetNames = this._options.resolveAsset(dirPath, fileNameHint);
    const assetName = getArrayLowestItem(assetNames);
    if (assetName != null) {
      const assetPath = path.join(dirPath, assetName);
      return {
        type: 'resolved',
        module: this._options.moduleCache.getAssetModule(assetPath),
      };
    }
    return {
      type: 'failed',
      candidates: {type: 'asset', name: fileNameHint},
    };
  }

  /**
   * A particular 'base path' can resolve to a number of possibilities depending
   * on the context. For example `foo/bar` could resolve to `foo/bar.ios.js`, or
   * to `foo/bar.js`. If can also resolve to the bare path `foo/bar` itself, as
   * supported by Node.js resolution. On the other hand it doesn't support
   * `foo/bar.ios`, for historical reasons.
   */
  _tryToResolveAllFileNames(
    resolver: FileNameResolver,
    fileNamePrefix: string,
  ): ?string {
    if (resolver.tryToResolveFileName(fileNamePrefix)) {
      return fileNamePrefix;
    }
    const {sourceExts} = this._options;
    for (let i = 0; i < sourceExts.length; i++) {
      const fileName = this._tryToResolveFileNamesForExt(
        fileNamePrefix,
        resolver,
        sourceExts[i],
      );
      if (fileName != null) {
        return fileName;
      }
    }
    return null;
  }

  /**
   * For a particular extension, ex. `js`, we want to try a few possibilities,
   * such as `foo.ios.js`, `foo.native.js`, and of course `foo.js`.
   */
  _tryToResolveFileNamesForExt(
    fileNamePrefix: string,
    resolver: FileNameResolver,
    ext: string,
  ): ?string {
    const {platform, preferNativePlatform} = this._options;
    if (platform != null) {
      const fileName = `${fileNamePrefix}.${platform}.${ext}`;
      if (resolver.tryToResolveFileName(fileName)) {
        return fileName;
      }
    }
    if (preferNativePlatform) {
      const fileName = `${fileNamePrefix}.native.${ext}`;
      if (resolver.tryToResolveFileName(fileName)) {
        return fileName;
      }
    }
    const fileName = `${fileNamePrefix}.${ext}`;
    return resolver.tryToResolveFileName(fileName) ? fileName : null;
  }

  _getEmptyModule(fromModule: TModule, toModuleName: string): TModule {
    const {moduleCache} = this._options;
    const module = moduleCache.getModule(ResolutionRequest.EMPTY_MODULE);
    if (module != null) {
      return module;
    }
    throw new UnableToResolveError(
      fromModule,
      toModuleName,
      "could not resolve `${ResolutionRequest.EMPTY_MODULE}'",
    );
  }

  /**
   * Same as `_loadAsDir`, but throws instead of returning candidates in case of
   * failure. We want to migrate all the callsites to `_loadAsDir` eventually.
   */
  _loadAsDirOrThrow(
    potentialDirPath: string,
    fromModule: TModule,
    toModuleName: string,
  ): TModule {
    const result = this._loadAsDir(potentialDirPath);
    if (result.type === 'resolved') {
      return result.module;
    }
    if (result.candidates.type === 'package') {
      throw new UnableToResolveError(
        fromModule,
        toModuleName,
        `could not resolve \`${potentialDirPath}' as a folder: it contained ` +
          'a package, but its "main" could not be resolved',
      );
    }
    invariant(result.candidates.type === 'index', 'invalid candidate type');
    throw new UnableToResolveError(
      fromModule,
      toModuleName,
      `could not resolve \`${potentialDirPath}' as a folder: it did not ` +
        'contain a package, nor an index file',
    );
  }

  /**
   * Try to resolve a potential path as if it was a directory-based module.
   * Either this is a directory that contains a package, or that the directory
   * contains an index file. If it fails to resolve these options, it returns
   * `null` and fills the array of `candidates` that were tried.
   *
   * For example we could try to resolve `/foo/bar`, that would eventually
   * resolve to `/foo/bar/lib/index.ios.js` if we're on platform iOS and that
   * `bar` contains a package which entry point is `./lib/index` (or `./lib`).
   */
  _loadAsDir(potentialDirPath: string): Resolution<TModule, DirCandidates> {
    const packageJsonPath = path.join(potentialDirPath, 'package.json');
    if (this._options.hasteFS.exists(packageJsonPath)) {
      return this._loadAsPackage(packageJsonPath);
    }
    const result = this._loadAsFile(potentialDirPath, 'index');
    if (result.type === 'resolved') {
      return result;
    }
    return {
      type: 'failed',
      candidates: {type: 'index', file: result.candidates},
    };
  }

  /**
   * Right now we just consider it a failure to resolve if we couldn't find the
   * file corresponding to the `main` indicated by a package. Argument can be
   * made this should be changed so that failing to find the `main` is not a
   * resolution failure, but identified instead as a corrupted or invalid
   * package (or that a package only supports a specific platform, etc.)
   */
  _loadAsPackage(packageJsonPath: string): Resolution<TModule, DirCandidates> {
    const package_ = this._options.moduleCache.getPackage(packageJsonPath);
    const mainPrefixPath = package_.getMain();
    const dirPath = path.dirname(mainPrefixPath);
    const prefixName = path.basename(mainPrefixPath);
    const fileResult = this._loadAsFile(dirPath, prefixName);
    if (fileResult.type === 'resolved') {
      return fileResult;
    }
    const dirResult = this._loadAsDir(mainPrefixPath);
    if (dirResult.type === 'resolved') {
      return dirResult;
    }
    return {
      type: 'failed',
      candidates: {
        type: 'package',
        dir: dirResult.candidates,
        file: fileResult.candidates,
      },
    };
  }

  _resetResolutionCache() {
    this._immediateResolutionCache = Object.create(null);
  }
}

function resolutionHash(modulePath, depName) {
  return `${path.resolve(modulePath)}:${depName}`;
}

class UnableToResolveError extends Error {
  type: string;
  from: string;
  to: string;

  constructor(fromModule, toModule, message) {
    super();
    this.from = fromModule.path;
    this.to = toModule;
    this.message = util.format(
      'Unable to resolve module `%s` from `%s`: %s',
      toModule,
      fromModule.path,
      message,
    );
    this.type = this.name = 'UnableToResolveError';
  }
}

function normalizePath(modulePath) {
  if (path.sep === '/') {
    modulePath = path.normalize(modulePath);
  } else if (path.posix) {
    modulePath = path.posix.normalize(modulePath);
  }

  return modulePath.replace(/\/$/, '');
}

// HasteFS stores paths with backslashes on Windows, this ensures the path is in
// the proper format. Will also add drive letter if not present so `/root` will
// resolve to `C:\root`. Noop on other platforms.
function resolveWindowsPath(modulePath) {
  if (path.sep !== '\\') {
    return modulePath;
  }
  return path.resolve(modulePath);
}

function isRelativeImport(filePath) {
  return /^[.][.]?(?:[/]|$)/.test(filePath);
}

function getArrayLowestItem(a: $ReadOnlyArray<string>): string | void {
  if (a.length === 0) {
    return undefined;
  }
  let lowest = a[0];
  for (let i = 1; i < a.length; ++i) {
    if (a[i] < lowest) {
      lowest = a[i];
    }
  }
  return lowest;
}

module.exports = ResolutionRequest;
