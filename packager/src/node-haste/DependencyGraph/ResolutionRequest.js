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
import type Module from '../Module';
import type ModuleCache from '../ModuleCache';
import type ResolutionResponse from './ResolutionResponse';

type DirExistsFn = (filePath: string) => boolean;

/**
 * `jest-haste-map`'s interface for ModuleMap.
 */
export type ModuleMap = {
  getModule(name: string, platform: string, supportsNativePlatform: boolean): ?string,
  getPackage(name: string, platform: string, supportsNativePlatform: boolean): ?string,
};

type Options = {
  dirExists: DirExistsFn,
  entryPath: string,
  extraNodeModules: ?Object,
  hasteFS: HasteFS,
  helpers: DependencyGraphHelpers,
  // TODO(cpojer): Remove 'any' type. This is used for ModuleGraph/node-haste
  moduleCache: ModuleCache | any,
  moduleMap: ModuleMap,
  platform: string,
  platforms: Set<string>,
  preferNativePlatform: boolean,
};

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

class ResolutionRequest {
  _dirExists: DirExistsFn;
  _entryPath: string;
  _extraNodeModules: ?Object;
  _hasteFS: HasteFS;
  _helpers: DependencyGraphHelpers;
  _immediateResolutionCache: {[key: string]: Module};
  _moduleCache: ModuleCache;
  _moduleMap: ModuleMap;
  _platform: string;
  _platforms: Set<string>;
  _preferNativePlatform: boolean;
  static emptyModule: string;

  constructor({
    dirExists,
    entryPath,
    extraNodeModules,
    hasteFS,
    helpers,
    moduleCache,
    moduleMap,
    platform,
    platforms,
    preferNativePlatform,
  }: Options) {
    this._dirExists = dirExists;
    this._entryPath = entryPath;
    this._extraNodeModules = extraNodeModules;
    this._hasteFS = hasteFS;
    this._helpers = helpers;
    this._moduleCache = moduleCache;
    this._moduleMap = moduleMap;
    this._platform = platform;
    this._platforms = platforms;
    this._preferNativePlatform = preferNativePlatform;
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

  // TODO(cpojer): Remove 'any' type. This is used for ModuleGraph/node-haste
  resolveDependency(fromModule: Module | any, toModuleName: string): Module {
    const resHash = resolutionHash(fromModule.path, toModuleName);

    const immediateResolution = this._immediateResolutionCache[resHash];
    if (immediateResolution) {
      return immediateResolution;
    }

    const cacheResult = result => {
      this._immediateResolutionCache[resHash] = result;
      return result;
    };

    if (!this._helpers.isNodeModulesDir(fromModule.path)
        && !(isRelativeImport(toModuleName) || isAbsolutePath(toModuleName))) {
      const result = tryResolveSync(
        () => this._resolveHasteDependency(fromModule, toModuleName),
        () => this._resolveNodeDependency(fromModule, toModuleName),
      );
      return cacheResult(result);
    }

    return cacheResult(this._resolveNodeDependency(fromModule, toModuleName));
  }

  resolveModuleDependencies(module: Module, dependencyNames: Array<string>): [Array<string>, Array<Module>] {
    const dependencies = dependencyNames.map(name => this.resolveDependency(module, name));
    return [dependencyNames, dependencies];
  }

  getOrderedDependencies({
    response,
    transformOptions,
    onProgress,
    recursive = true,
  }: {
    response: ResolutionResponse,
    transformOptions: Object,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
    recursive: boolean,
  }) {
    const entry = this._moduleCache.getModule(this._entryPath);

    response.pushDependency(entry);
    let totalModules = 1;
    let finishedModules = 0;

    const resolveDependencies = module => Promise.resolve().then(() => {
      const result = module.readCached(transformOptions);
      if (result != null) {
        return this.resolveModuleDependencies(module, result.dependencies);
      }
      return module.read(transformOptions)
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
        onProgress(finishedModules, totalModules);
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

  _resolveHasteDependency(fromModule: Module, toModuleName: string): Module {
    toModuleName = normalizePath(toModuleName);

    const pck = fromModule.getPackage();
    let realModuleName;
    if (pck) {
      realModuleName = pck.redirectRequire(toModuleName);
    } else {
      realModuleName = toModuleName;
    }

    const modulePath = this._moduleMap
      .getModule(realModuleName, this._platform, /* supportsNativePlatform */ true);
    if (modulePath != null) {
      const module = this._moduleCache.getModule(modulePath);
      /* temporary until we strengthen the typing */
      invariant(module.type === 'Module', 'expected Module type');
      return module;
    }

    let packageName = realModuleName;
    let packagePath;
    while (packageName && packageName !== '.') {
      packagePath = this._moduleMap
        .getPackage(packageName, this._platform, /* supportsNativePlatform */ true);
      if (packagePath != null) {
        break;
      }
      packageName = path.dirname(packageName);
    }

    if (packagePath != null) {

      const package_ = this._moduleCache.getPackage(packagePath);
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

  _redirectRequire(fromModule: Module, modulePath: string): string | false {
    const pck = fromModule.getPackage();
    if (pck) {
      return pck.redirectRequire(modulePath);
    }
    return modulePath;
  }

  _resolveFileOrDir(fromModule: Module, toModuleName: string): Module {
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

  _resolveNodeDependency(fromModule: Module, toModuleName: string): Module {
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
      if (this._dirExists(searchPath)) {
        searchQueue.push(
          path.join(searchPath, realModuleName)
        );
      }
    }

    if (this._extraNodeModules) {
      const {_extraNodeModules} = this;
      const bits = toModuleName.split(path.sep);
      const packageName = bits[0];
      if (_extraNodeModules[packageName]) {
        bits[0] = _extraNodeModules[packageName];
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
  _tryResolveNodeDep(searchPath: string, fromModule: Module, toModuleName: string): ?Module {
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

  _loadAsFile(potentialModulePath: string, fromModule: Module, toModule: string): Module {
    if (this._helpers.isAssetFile(potentialModulePath)) {
      let dirname = path.dirname(potentialModulePath);
      if (!this._dirExists(dirname)) {
        throw new UnableToResolveError(
          fromModule,
          toModule,
          `Directory ${dirname} doesn't exist`,
        );
      }

      const {name, type} = getAssetDataFromName(potentialModulePath, this._platforms);

      let pattern = name + '(@[\\d\\.]+x)?';
      if (this._platform != null) {
        pattern += '(\\.' + this._platform + ')?';
      }
      pattern += '\\.' + type;

      // Escape backslashes in the path to be able to use it in the regex
      if (path.sep === '\\') {
        dirname = dirname.replace(/\\/g, '\\\\');
      }

      // We arbitrarly grab the first one, because scale selection
      // will happen somewhere
      const [assetFile] = this._hasteFS.matchFiles(
        new RegExp(dirname + '(\/|\\\\)' + pattern)
      );
      if (assetFile) {
        return this._moduleCache.getAssetModule(assetFile);
      }
    }

    let file;
    if (this._hasteFS.exists(potentialModulePath)) {
      file = potentialModulePath;
    } else if (this._platform != null &&
               this._hasteFS.exists(potentialModulePath + '.' + this._platform + '.js')) {
      file = potentialModulePath + '.' + this._platform + '.js';
    } else if (this._preferNativePlatform &&
               this._hasteFS.exists(potentialModulePath + '.native.js')) {
      file = potentialModulePath + '.native.js';
    } else if (this._hasteFS.exists(potentialModulePath + '.js')) {
      file = potentialModulePath + '.js';
    } else if (this._hasteFS.exists(potentialModulePath + '.json')) {
      file = potentialModulePath + '.json';
    } else {
      throw new UnableToResolveError(
        fromModule,
        toModule,
        `File ${potentialModulePath} doesn't exist`,
      );
    }

    return this._moduleCache.getModule(file);
  }

  _loadAsDir(potentialDirPath: string, fromModule: Module, toModule: string): Module {
    if (!this._dirExists(potentialDirPath)) {
      throw new UnableToResolveError(
        fromModule,
        toModule,
        `Directory ${potentialDirPath} doesn't exist`,
      );
    }

    const packageJsonPath = path.join(potentialDirPath, 'package.json');
    if (this._hasteFS.exists(packageJsonPath)) {
      const main = this._moduleCache.getPackage(packageJsonPath).getMain();
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

ResolutionRequest.emptyModule = require.resolve('./assets/empty-module.js');

module.exports = ResolutionRequest;
