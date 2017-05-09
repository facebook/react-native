/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const AsyncTaskGroup = require('../lib/AsyncTaskGroup');
const MapWithDefaults = require('../lib/MapWithDefaults');

const debug = require('debug')('RNP:DependencyGraph');
const util = require('util');
const path = require('path');
const realPath = require('path');
const invariant = require('fbjs/lib/invariant');
const isAbsolutePath = require('absolute-path');
const getAssetDataFromName = require('../lib/getAssetDataFromName');

import type {HasteFS} from '../types';
import type DependencyGraphHelpers from './DependencyGraphHelpers';
import type ResolutionResponse from './ResolutionResponse';
import type {Options as TransformWorkerOptions} from '../../JSTransformer/worker/worker';
import type {ReadResult, CachedReadResult} from '../Module';

type DirExistsFn = (filePath: string) => boolean;

/**
 * `jest-haste-map`'s interface for ModuleMap.
 */
export type ModuleMap = {
  getModule(name: string, platform: ?string, supportsNativePlatform: boolean): ?string,
  getPackage(name: string, platform: ?string, supportsNativePlatform: boolean): ?string,
};

type Packageish = {
  redirectRequire(toModuleName: string): string | false,
  getMain(): string,
  +root: string,
};

type Moduleish = {
  +path: string,
  getPackage(): ?Packageish,
  hash(): string,
  readCached(transformOptions: TransformWorkerOptions): CachedReadResult,
  readFresh(transformOptions: TransformWorkerOptions): Promise<ReadResult>,
};

type ModuleishCache<TModule, TPackage> = {
  getPackage(name: string, platform?: string, supportsNativePlatform?: boolean): TPackage,
  getModule(path: string): TModule,
  getAssetModule(path: string): TModule,
};

type MatchFilesByDirAndPattern = (dirName: string, pattern: RegExp) => Array<string>;

type Options<TModule, TPackage> = {|
  +dirExists: DirExistsFn,
  +entryPath: string,
  +extraNodeModules: ?Object,
  +hasteFS: HasteFS,
  +helpers: DependencyGraphHelpers,
  +matchFiles: MatchFilesByDirAndPattern,
  +moduleCache: ModuleishCache<TModule, TPackage>,
  +moduleMap: ModuleMap,
  +platform: ?string,
  +platforms: Set<string>,
  +preferNativePlatform: boolean,
  +sourceExts: Array<string>,
|};

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

  _immediateResolutionCache: {[key: string]: TModule};
  _options: Options<TModule, TPackage>;
  static emptyModule: string;

  constructor(options: Options<TModule, TPackage>) {
    this._options = options;
    this._resetResolutionCache();
  }

  _tryResolve<T>(action: () => Promise<T>, secondaryAction: () => ?Promise<T>): Promise<T> {
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

    if (!this._options.helpers.isNodeModulesDir(fromModule.path)
        && !(isRelativeImport(toModuleName) || isAbsolutePath(toModuleName))) {
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
    const dependencies = dependencyNames.map(name => this.resolveDependency(module, name));
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

    const resolveDependencies = (module: TModule) => Promise.resolve().then(() => {
      const cached = module.readCached(transformOptions);
      if (cached.result != null) {
        return this.resolveModuleDependencies(module, cached.result.dependencies);
      }
      return module.readFresh(transformOptions)
        .then(({dependencies}) => this.resolveModuleDependencies(module, dependencies));
    });

    const collectedDependencies = new MapWithDefaults(module => collect(module));
    const crawlDependencies = (mod, [depNames, dependencies]) => {
      const filteredPairs = [];

      dependencies.forEach((modDep, i) => {
        const name = depNames[i];
        if (modDep == null) {
          debug(
            'WARNING: Cannot find required module `%s` from module `%s`',
            name,
            mod.path
          );
          return false;
        }
        return filteredPairs.push([name, modDep]);
      });

      response.setResolvedDependencyPairs(mod, filteredPairs);

      const dependencyModules = filteredPairs.map(([, m]) => m);
      const newDependencies =
        dependencyModules.filter(m => !collectedDependencies.has(m));

      if (onProgress) {
        finishedModules += 1;
        totalModules += newDependencies.length;
        onProgress(finishedModules, Math.max(totalModules, preprocessedModuleCount));
      }

      if (recursive) {
        // doesn't block the return of this function invocation, but defers
        // the resulution of collectionsInProgress.done.then(...)
        dependencyModules
          .forEach(dependency => collectedDependencies.get(dependency));
      }
      return dependencyModules;
    };

    const collectionsInProgress = new AsyncTaskGroup();
    function collect(module) {
      collectionsInProgress.start(module);
      const result = resolveDependencies(module)
        .then(deps => crawlDependencies(module, deps));
      const end = () => collectionsInProgress.end(module);
      result.then(end, end);
      return result;
    }

    return Promise.all([
      // kicks off recursive dependency discovery, but doesn't block until it's done
      collectedDependencies.get(entry),

      // resolves when there are no more modules resolving dependencies
      collectionsInProgress.done,
    ]).then(([rootDependencies]) => {
      return Promise.all(
        Array.from(collectedDependencies, resolveKeyWithPromise)
      ).then(moduleToDependenciesPairs =>
        [rootDependencies, new MapWithDefaults(() => [], moduleToDependenciesPairs)]
      );
    }).then(([rootDependencies, moduleDependencies]) => {
      // serialize dependencies, and make sure that every single one is only
      // included once
      const seen = new Set([entry]);
      function traverse(dependencies) {
        dependencies.forEach(dependency => {
          if (seen.has(dependency)) { return; }

          seen.add(dependency);
          response.pushDependency(dependency);
          traverse(moduleDependencies.get(dependency));
        });
      }

      traverse(rootDependencies);
    });
  }

  /**
   * This synchronously look at all the specified modules and recursively kicks off global cache
   * fetching or transforming (via `readFresh`). This is a hack that workaround the current
   * structure, because we could do better. First off, the algorithm that resolves dependencies
   * recursively should be synchronous itself until it cannot progress anymore (and needs to
   * call `readFresh`), so that this algo would be integrated into it.
   */
  _preprocessPotentialDependencies(
    transformOptions: TransformWorkerOptions,
    module: TModule,
    onProgress: (moduleCount: number) => mixed,
  ): void {
    const visitedModulePaths = new Set();
    const pendingBatches = [this.preprocessModule(transformOptions, module, visitedModulePaths)];
    onProgress(visitedModulePaths.size);
    while (pendingBatches.length > 0) {
      const dependencyModules = pendingBatches.pop();
      while (dependencyModules.length > 0) {
        const dependencyModule = dependencyModules.pop();
        const deps = this.preprocessModule(transformOptions, dependencyModule, visitedModulePaths);
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
      ? cached.result.dependencies : cached.outdatedDependencies;
    return this.tryResolveModuleDependencies(module, dependencies, visitedModulePaths);
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
      /* $FlowFixMe: redirectRequire can actually return `false` for exclusions */
      realModuleName = (pck.redirectRequire(toModuleName): string);
    } else {
      realModuleName = toModuleName;
    }

    const modulePath = this._options.moduleMap
      .getModule(realModuleName, this._options.platform, /* supportsNativePlatform */ true);
    if (modulePath != null) {
      const module = this._options.moduleCache.getModule(modulePath);
      /* temporary until we strengthen the typing */
      invariant(module.type === 'Module', 'expected Module type');
      return module;
    }

    let packageName = realModuleName;
    let packagePath;
    while (packageName && packageName !== '.') {
      packagePath = this._options.moduleMap
        .getPackage(packageName, this._options.platform, /* supportsNativePlatform */ true);
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
        path.relative(packageName, realModuleName)
      );
      return tryResolveSync(
        () => this._loadAsFile(
          potentialModulePath,
          fromModule,
          toModuleName,
        ),
        () => this._loadAsDir(potentialModulePath, fromModule, toModuleName),
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
    const potentialModulePath = isAbsolutePath(toModuleName) ?
      resolveWindowsPath(toModuleName) :
      path.join(path.dirname(fromModule.path), toModuleName);

    const realModuleName = this._redirectRequire(fromModule, potentialModulePath);
    if (realModuleName === false) {
      return this._loadAsFile(
        ResolutionRequest.emptyModule,
        fromModule,
        toModuleName,
      );
    }

    return tryResolveSync(
      () => this._loadAsFile(realModuleName, fromModule, toModuleName),
      () => this._loadAsDir(realModuleName, fromModule, toModuleName)
    );
  }

  _resolveNodeDependency(fromModule: TModule, toModuleName: string): TModule {
    if (isRelativeImport(toModuleName) || isAbsolutePath(toModuleName)) {
      return this._resolveFileOrDir(fromModule, toModuleName);
    }
    const realModuleName = this._redirectRequire(fromModule, toModuleName);
    // exclude
    if (realModuleName === false) {
      return this._loadAsFile(
        ResolutionRequest.emptyModule,
        fromModule,
        toModuleName,
      );
    }

    if (isRelativeImport(realModuleName) || isAbsolutePath(realModuleName)) {
      // derive absolute path /.../node_modules/fromModuleDir/realModuleName
      const fromModuleParentIdx = fromModule.path.lastIndexOf('node_modules' + path.sep) + 13;
      const fromModuleDir = fromModule.path.slice(
        0,
        fromModule.path.indexOf(path.sep, fromModuleParentIdx),
      );
      const absPath = path.join(fromModuleDir, realModuleName);
      return this._resolveFileOrDir(fromModule, absPath);
    }

    const searchQueue = [];
    for (let currDir = path.dirname(fromModule.path);
         currDir !== '.' && currDir !== realPath.parse(fromModule.path).root;
         currDir = path.dirname(currDir)) {
      const searchPath = path.join(currDir, 'node_modules');
      if (this._options.dirExists(searchPath)) {
        searchQueue.push(
          path.join(searchPath, realModuleName)
        );
      }
    }

    if (this._options.extraNodeModules) {
      const {extraNodeModules} = this._options;
      const bits = toModuleName.split(path.sep);
      const packageName = bits[0];
      if (extraNodeModules[packageName]) {
        bits[0] = extraNodeModules[packageName];
        searchQueue.push(path.join.apply(path, bits));
      }
    }

    for (let i = 0; i < searchQueue.length; ++i) {
      const resolvedModule = this._tryResolveNodeDep(searchQueue[i], fromModule, toModuleName);
      if (resolvedModule != null) {
        return resolvedModule;
      }
    }

    const hint = searchQueue.length ? ' or in these directories:' : '';
    throw new UnableToResolveError(
      fromModule,
      toModuleName,
      `Module does not exist in the module map${hint}\n` +
        searchQueue.map(searchPath => `  ${path.dirname(searchPath)}\n`).join(', ') + '\n' +
      `This might be related to https://github.com/facebook/react-native/issues/4968\n` +
      `To resolve try the following:\n` +
      `  1. Clear watchman watches: \`watchman watch-del-all\`.\n` +
      `  2. Delete the \`node_modules\` folder: \`rm -rf node_modules && npm install\`.\n` +
      '  3. Reset packager cache: `rm -fr $TMPDIR/react-*` or `npm start -- --reset-cache`.'
    );
  }

  /**
   * This is written as a separate function because "try..catch" blocks cause
   * the entire surrounding function to be deoptimized.
   */
  _tryResolveNodeDep(searchPath: string, fromModule: TModule, toModuleName: string): ?TModule {
    try {
      return tryResolveSync(
        () => this._loadAsFile(searchPath, fromModule, toModuleName),
        () => this._loadAsDir(searchPath, fromModule, toModuleName),
      );
    } catch (error) {
      if (error.type !== 'UnableToResolveError') {
        throw error;
      }
      return null;
    }
  }

  _loadAsFile(potentialModulePath: string, fromModule: TModule, toModule: string): TModule {
    if (this._options.helpers.isAssetFile(potentialModulePath)) {
      const dirname = path.dirname(potentialModulePath);
      if (!this._options.dirExists(dirname)) {
        throw new UnableToResolveError(
          fromModule,
          toModule,
          `Directory ${dirname} doesn't exist`,
        );
      }

      const {name, type} = getAssetDataFromName(potentialModulePath, this._options.platforms);

      let pattern = '^' + name + '(@[\\d\\.]+x)?';
      if (this._options.platform != null) {
        pattern += '(\\.' + this._options.platform + ')?';
      }
      pattern += '\\.' + type + '$';

      const assetFiles = this._options.matchFiles(dirname, new RegExp(pattern));
      // We arbitrarly grab the lowest, because scale selection will happen
      // somewhere else. Always the lowest so that it's stable between builds.
      const assetFile = getArrayLowestItem(assetFiles);
      if (assetFile) {
        return this._options.moduleCache.getAssetModule(assetFile);
      }
    }

    let file;
    if (this._options.hasteFS.exists(potentialModulePath)) {
      file = potentialModulePath;
    } else {
      const {platform, preferNativePlatform, hasteFS} = this._options;
      for (let i = 0; i < this._options.sourceExts.length; i++) {
        const ext = this._options.sourceExts[i];
        if (platform != null) {
          const platformSpecificPath = `${potentialModulePath}.${platform}.${ext}`;
          if (hasteFS.exists(platformSpecificPath)) {
            file = platformSpecificPath;
            break;
          }
        }
        if (preferNativePlatform) {
          const nativeSpecificPath = `${potentialModulePath}.native.${ext}`;
          if (hasteFS.exists(nativeSpecificPath)) {
            file = nativeSpecificPath;
            break;
          }
        }
        const genericPath = `${potentialModulePath}.${ext}`;
        if (hasteFS.exists(genericPath)) {
          file = genericPath;
          break;
        }
      }

      if (file == null) {
        throw new UnableToResolveError(
          fromModule,
          toModule,
          `File ${potentialModulePath} doesn't exist`,
        );
      }

    }

    return this._options.moduleCache.getModule(file);
  }

  _loadAsDir(potentialDirPath: string, fromModule: TModule, toModule: string): TModule {
    if (!this._options.dirExists(potentialDirPath)) {
      throw new UnableToResolveError(
        fromModule,
        toModule,
        `Directory ${potentialDirPath} doesn't exist`,
      );
    }

    const packageJsonPath = path.join(potentialDirPath, 'package.json');
    if (this._options.hasteFS.exists(packageJsonPath)) {
      const main = this._options.moduleCache.getPackage(packageJsonPath).getMain();
      return tryResolveSync(
        () => this._loadAsFile(main, fromModule, toModule),
        () => this._loadAsDir(main, fromModule, toModule),
      );
    }

    return this._loadAsFile(
      path.join(potentialDirPath, 'index'),
      fromModule,
      toModule,
    );
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

// HasteFS stores paths with backslashes on Windows, this ensures the path is
// in the proper format. Will also add drive letter if not present so `/root` will
// resolve to `C:\root`. Noop on other platforms.
function resolveWindowsPath(modulePath) {
  if (path.sep !== '\\') {
    return modulePath;
  }
  return path.resolve(modulePath);
}

function resolveKeyWithPromise([key, promise]) {
  return promise.then(value => [key, value]);
}

function isRelativeImport(filePath) {
  return /^[.][.]?(?:[/]|$)/.test(filePath);
}

function getArrayLowestItem(a: Array<string>): string | void {
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

ResolutionRequest.emptyModule = require.resolve('./assets/empty-module.js');

module.exports = ResolutionRequest;
