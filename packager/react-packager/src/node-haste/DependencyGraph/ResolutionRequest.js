 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const AsyncTaskGroup = require('../lib/AsyncTaskGroup');
const MapWithDefaults = require('../lib/MapWithDefaults');
const debug = require('debug')('ReactNativePackager:DependencyGraph');
const util = require('util');
const path = require('../fastpath');
const realPath = require('path');
const isAbsolutePath = require('absolute-path');
const getAssetDataFromName = require('../lib/getAssetDataFromName');

const emptyModule = require.resolve('./assets/empty-module.js');

class ResolutionRequest {
  constructor({
    platform,
    platforms,
    preferNativePlatform,
    entryPath,
    hasteMap,
    deprecatedAssetMap,
    helpers,
    moduleCache,
    fastfs,
    shouldThrowOnUnresolvedErrors,
    extraNodeModules,
  }) {
    this._platform = platform;
    this._platforms = platforms;
    this._preferNativePlatform = preferNativePlatform;
    this._entryPath = entryPath;
    this._hasteMap = hasteMap;
    this._deprecatedAssetMap = deprecatedAssetMap;
    this._helpers = helpers;
    this._moduleCache = moduleCache;
    this._fastfs = fastfs;
    this._shouldThrowOnUnresolvedErrors = shouldThrowOnUnresolvedErrors;
    this._extraNodeModules = extraNodeModules;
    this._resetResolutionCache();
  }

  _tryResolve(action, secondaryAction) {
    return action().catch((error) => {
      if (error.type !== 'UnableToResolveError') {
        throw error;
      }
      return secondaryAction();
    });
  }

  resolveDependency(fromModule, toModuleName) {
    const resHash = resolutionHash(fromModule.path, toModuleName);

    if (this._immediateResolutionCache[resHash]) {
      return Promise.resolve(this._immediateResolutionCache[resHash]);
    }

    const asset_DEPRECATED = this._deprecatedAssetMap.resolve(
      fromModule,
      toModuleName
    );
    if (asset_DEPRECATED) {
      return Promise.resolve(asset_DEPRECATED);
    }

    const cacheResult = (result) => {
      this._immediateResolutionCache[resHash] = result;
      return result;
    };

    const forgive = (error) => {
      if (
        error.type !== 'UnableToResolveError' ||
        this._shouldThrowOnUnresolvedErrors(this._entryPath, this._platform)
      ) {
        throw error;
      }

      debug(
        'Unable to resolve module %s from %s',
        toModuleName,
        fromModule.path
      );
      return null;
    };

    if (!this._helpers.isNodeModulesDir(fromModule.path)
        && !(isRelativeImport(toModuleName) || isAbsolutePath(toModuleName))) {
      return this._tryResolve(
        () => this._resolveHasteDependency(fromModule, toModuleName),
        () => this._resolveNodeDependency(fromModule, toModuleName)
      ).then(
        cacheResult,
        forgive,
      );
    }

    return this._resolveNodeDependency(fromModule, toModuleName)
      .then(
        cacheResult,
        forgive,
      );
  }

  getOrderedDependencies({
    response,
    mocksPattern,
    transformOptions,
    onProgress,
    recursive = true,
  }) {
    return this._getAllMocks(mocksPattern).then(allMocks => {
      const entry = this._moduleCache.getModule(this._entryPath);
      const mocks = Object.create(null);

      response.pushDependency(entry);
      let totalModules = 1;
      let finishedModules = 0;

      const resolveDependencies = module =>
        module.getDependencies(transformOptions)
          .then(dependencyNames =>
            Promise.all(
              dependencyNames.map(name => this.resolveDependency(module, name))
            ).then(dependencies => [dependencyNames, dependencies])
          );

      const addMockDependencies = !allMocks
        ? (module, result) => result
        : (module, [dependencyNames, dependencies]) => {
          const list = [module.getName()];
          const pkg = module.getPackage();
          if (pkg) {
            list.push(pkg.getName());
          }
          return Promise.all(list).then(names => {
            names.forEach(name => {
              if (allMocks[name] && !mocks[name]) {
                const mockModule = this._moduleCache.getModule(allMocks[name]);
                dependencyNames.push(name);
                dependencies.push(mockModule);
                mocks[name] = allMocks[name];
              }
            });
            return [dependencyNames, dependencies];
          });
        };

      const collectedDependencies = new MapWithDefaults(module => collect(module));
      const crawlDependencies = (mod, [depNames, dependencies]) => {
        const filteredPairs = [];

        dependencies.forEach((modDep, i) => {
          const name = depNames[i];
          if (modDep == null) {
            // It is possible to require mocks that don't have a real
            // module backing them. If a dependency cannot be found but there
            // exists a mock with the desired ID, resolve it and add it as
            // a dependency.
            if (allMocks && allMocks[name] && !mocks[name]) {
              const mockModule = this._moduleCache.getModule(allMocks[name]);
              mocks[name] = allMocks[name];
              return filteredPairs.push([name, mockModule]);
            }

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
          .then(result => addMockDependencies(module, result))
          .then(result => crawlDependencies(module, result));
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
        response.setMocks(mocks);
      });
    });
  }

  _getAllMocks(pattern) {
    // Take all mocks in all the roots into account. This is necessary
    // because currently mocks are global: any module can be mocked by
    // any mock in the system.
    let mocks = null;
    if (pattern) {
      mocks = Object.create(null);
      this._fastfs.matchFilesByPattern(pattern).forEach(file =>
        mocks[path.basename(file, path.extname(file))] = file
      );
    }
    return Promise.resolve(mocks);
  }

  _resolveHasteDependency(fromModule, toModuleName) {
    toModuleName = normalizePath(toModuleName);

    let p = fromModule.getPackage();
    if (p) {
      p = p.redirectRequire(toModuleName);
    } else {
      p = Promise.resolve(toModuleName);
    }

    return p.then((realModuleName) => {
      let dep = this._hasteMap.getModule(realModuleName, this._platform);
      if (dep && dep.type === 'Module') {
        return dep;
      }

      let packageName = realModuleName;
      while (packageName && packageName !== '.') {
        dep = this._hasteMap.getModule(packageName, this._platform);
        if (dep && dep.type === 'Package') {
          break;
        }
        packageName = path.dirname(packageName);
      }

      if (dep && dep.type === 'Package') {
        const potentialModulePath = path.join(
          dep.root,
          path.relative(packageName, realModuleName)
        );
        return this._tryResolve(
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
    });
  }

  _redirectRequire(fromModule, modulePath) {
    return Promise.resolve(fromModule.getPackage()).then(p => {
      if (p) {
        return p.redirectRequire(modulePath);
      }
      return modulePath;
    });
  }

  _resolveFileOrDir(fromModule, toModuleName) {
    const potentialModulePath = isAbsolutePath(toModuleName) ?
        toModuleName :
        path.join(path.dirname(fromModule.path), toModuleName);

    return this._redirectRequire(fromModule, potentialModulePath).then(
      realModuleName => {
        if (realModuleName === false) {
          return this._loadAsFile(emptyModule, fromModule, toModuleName);
        }

        return this._tryResolve(
          () => this._loadAsFile(realModuleName, fromModule, toModuleName),
          () => this._loadAsDir(realModuleName, fromModule, toModuleName)
        );
      }
    );
  }

  _resolveNodeDependency(fromModule, toModuleName) {
    if (isRelativeImport(toModuleName) || isAbsolutePath(toModuleName)) {
      return this._resolveFileOrDir(fromModule, toModuleName);
    } else {
      return this._redirectRequire(fromModule, toModuleName).then(
        realModuleName => {
          // exclude
          if (realModuleName === false) {
            return this._loadAsFile(emptyModule, fromModule, toModuleName);
          }

          if (isRelativeImport(realModuleName) || isAbsolutePath(realModuleName)) {
            // derive absolute path /.../node_modules/fromModuleDir/realModuleName
            const fromModuleParentIdx = fromModule.path.lastIndexOf('node_modules/') + 13;
            const fromModuleDir = fromModule.path.slice(0, fromModule.path.indexOf('/', fromModuleParentIdx));
            const absPath = path.join(fromModuleDir, realModuleName);
            return this._resolveFileOrDir(fromModule, absPath);
          }

          const searchQueue = [];
          for (let currDir = path.dirname(fromModule.path);
               currDir !== realPath.parse(fromModule.path).root;
               currDir = path.dirname(currDir)) {
            let searchPath = path.join(currDir, 'node_modules');
            if (this._fastfs.dirExists(searchPath)) {
              searchQueue.push(
                path.join(searchPath, realModuleName)
              );
            }
          }

          if (this._extraNodeModules) {
            const bits = toModuleName.split('/');
            const packageName = bits[0];
            if (this._extraNodeModules[packageName]) {
              bits[0] = this._extraNodeModules[packageName];
              searchQueue.push(path.join.apply(path, bits));
            }
          }

          let p = Promise.reject(new UnableToResolveError(fromModule, toModuleName));
          searchQueue.forEach(potentialModulePath => {
            p = this._tryResolve(
              () => this._tryResolve(
                () => p,
                () => this._loadAsFile(potentialModulePath, fromModule, toModuleName),
              ),
              () => this._loadAsDir(potentialModulePath, fromModule, toModuleName)
            );
          });

          return p.catch(error => {
            if (error.type !== 'UnableToResolveError') {
              throw error;
            }
            throw new UnableToResolveError(
              fromModule,
              toModuleName,
              `Module does not exist in the module map ${searchQueue.length ? 'or in these directories:' : ''}\n` +
                searchQueue.map(searchPath => `  ${path.dirname(searchPath)}\n`) + '\n' +
              `This might be related to https://github.com/facebook/react-native/issues/4968\n` +
              `To resolve try the following:\n` +
              `  1. Clear watchman watches: \`watchman watch-del-all\`.\n` +
              `  2. Delete the \`node_modules\` folder: \`rm -rf node_modules && npm install\`.\n` +
              `  3. Reset packager cache: \`rm -fr $TMPDIR/react-*\` or \`npm start -- --reset-cache\`.`
            );
          });
        });
    }
  }

  _loadAsFile(potentialModulePath, fromModule, toModule) {
    return Promise.resolve().then(() => {
      if (this._helpers.isAssetFile(potentialModulePath)) {
        const dirname = path.dirname(potentialModulePath);
        if (!this._fastfs.dirExists(dirname)) {
          throw new UnableToResolveError(
            fromModule,
            toModule,
            `Directory ${dirname} doesn't exist`,
          );
        }

        const {name, type} = getAssetDataFromName(potentialModulePath, this._platforms);

        let pattern = '^' + name + '(@[\\d\\.]+x)?';
        if (this._platform != null) {
          pattern += '(\\.' + this._platform + ')?';
        }
        pattern += '\\.' + type;

        // We arbitrarly grab the first one, because scale selection
        // will happen somewhere
        const [assetFile] = this._fastfs.matches(
          dirname,
          new RegExp(pattern)
        );

        if (assetFile) {
          return this._moduleCache.getAssetModule(assetFile);
        }
      }

      let file;
      if (this._fastfs.fileExists(potentialModulePath)) {
        file = potentialModulePath;
      } else if (this._platform != null &&
                 this._fastfs.fileExists(potentialModulePath + '.' + this._platform + '.js')) {
        file = potentialModulePath + '.' + this._platform + '.js';
      } else if (this._preferNativePlatform &&
                 this._fastfs.fileExists(potentialModulePath + '.native.js')) {
        file = potentialModulePath + '.native.js';
      } else if (this._fastfs.fileExists(potentialModulePath + '.js')) {
        file = potentialModulePath + '.js';
      } else if (this._fastfs.fileExists(potentialModulePath + '.json')) {
        file = potentialModulePath + '.json';
      } else {
        throw new UnableToResolveError(
          fromModule,
          toModule,
          `File ${potentialModulePath} doesnt exist`,
        );
      }

      return this._moduleCache.getModule(file);
    });
  }

  _loadAsDir(potentialDirPath, fromModule, toModule) {
    return Promise.resolve().then(() => {
      if (!this._fastfs.dirExists(potentialDirPath)) {
        throw new UnableToResolveError(
          fromModule,
          toModule,
          `Directory ${potentialDirPath} doesnt exist`,
        );
      }

      const packageJsonPath = path.join(potentialDirPath, 'package.json');
      if (this._fastfs.fileExists(packageJsonPath)) {
        return this._moduleCache.getPackage(packageJsonPath)
          .getMain().then(
            (main) => this._tryResolve(
              () => this._loadAsFile(main, fromModule, toModule),
              () => this._loadAsDir(main, fromModule, toModule)
            )
          );
      }

      return this._loadAsFile(
        path.join(potentialDirPath, 'index'),
        fromModule,
        toModule,
      );
    });
  }

  _resetResolutionCache() {
    this._immediateResolutionCache = Object.create(null);
  }

}


function resolutionHash(modulePath, depName) {
  return `${path.resolve(modulePath)}:${depName}`;
}


function UnableToResolveError(fromModule, toModule, message) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = util.format(
    'Unable to resolve module %s from %s: %s',
    toModule,
    fromModule.path,
    message,
  );
  this.type = this.name = 'UnableToResolveError';
}

util.inherits(UnableToResolveError, Error);

function normalizePath(modulePath) {
  if (path.sep === '/') {
    modulePath = path.normalize(modulePath);
  } else if (path.posix) {
    modulePath = path.posix.normalize(modulePath);
  }

  return modulePath.replace(/\/$/, '');
}

function resolveKeyWithPromise([key, promise]) {
  return promise.then(value => [key, value]);
}

function isRelativeImport(path) {
  return /^[.][.]?(?:[/]|$)/.test(path);
}

module.exports = ResolutionRequest;
