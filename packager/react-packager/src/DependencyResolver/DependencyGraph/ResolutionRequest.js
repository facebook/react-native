 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const debug = require('debug')('ReactPackager:DependencyGraph');
const util = require('util');
const path = require('path');
const isAbsolutePath = require('absolute-path');
const getAssetDataFromName = require('../../lib/getAssetDataFromName');

class ResolutionRequest {
  constructor({
    platform,
    entryPath,
    hasteMap,
    deprecatedAssetMap,
    helpers,
    moduleCache,
    fastfs,
  }) {
    this._platform = platform;
    this._entryPath = entryPath;
    this._hasteMap = hasteMap;
    this._deprecatedAssetMap = deprecatedAssetMap;
    this._helpers = helpers;
    this._moduleCache = moduleCache;
    this._fastfs = fastfs;
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
      if (error.type !== 'UnableToResolveError') {
        throw error;
      }

      console.warn(
        'Unable to resolve module %s from %s',
        toModuleName,
        fromModule.path
      );
      return null;
    };

    if (!this._helpers.isNodeModulesDir(fromModule.path)
        && toModuleName[0] !== '.' &&
        toModuleName[0] !== '/') {
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
        forgive
      );
  }

  getOrderedDependencies(response) {
    return Promise.resolve().then(() => {
      const entry = this._moduleCache.getModule(this._entryPath);
      const visited = Object.create(null);
      visited[entry.hash()] = true;

      const collect = (mod) => {
        response.pushDependency(mod);
        return mod.getDependencies().then(
          depNames => Promise.all(
            depNames.map(name => this.resolveDependency(mod, name))
          ).then((dependencies) => [depNames, dependencies])
        ).then(([depNames, dependencies]) => {
          let p = Promise.resolve();

          const filteredPairs = [];

          dependencies.forEach((modDep, i) => {
            if (modDep == null) {
              debug(
                'WARNING: Cannot find required module `%s` from module `%s`',
                depNames[i],
                mod.path
              );
              return false;
            }
            return filteredPairs.push([depNames[i], modDep]);
          });

          response.setResolvedDependencyPairs(mod, filteredPairs);

          filteredPairs.forEach(([depName, modDep]) => {
            p = p.then(() => {
              if (!visited[modDep.hash()]) {
                visited[modDep.hash()] = true;
                return collect(modDep);
              }
              return null;
            });
          });

          return p;
        });
      };

      return collect(entry);
    });
  }

  getAsyncDependencies(response) {
    return Promise.resolve().then(() => {
      const mod = this._moduleCache.getModule(this._entryPath);
      return mod.getAsyncDependencies().then(bundles =>
        Promise
          .all(bundles.map(bundle =>
            Promise.all(bundle.map(
              dep => this.resolveDependency(mod, dep)
            ))
          ))
          .then(bs => bs.map(bundle => bundle.map(dep => dep.path)))
      );
    }).then(asyncDependencies => asyncDependencies.forEach(
      (dependency) => response.pushAsyncDependency(dependency)
    ));
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
          () => this._loadAsFile(potentialModulePath),
          () => this._loadAsDir(potentialModulePath),
        );
      }

      throw new UnableToResolveError('Unable to resolve dependency');
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

  _resolveNodeDependency(fromModule, toModuleName) {
    if (toModuleName[0] === '.' || toModuleName[1] === '/') {
      const potentialModulePath = isAbsolutePath(toModuleName) ?
              toModuleName :
              path.join(path.dirname(fromModule.path), toModuleName);
      return this._redirectRequire(fromModule, potentialModulePath).then(
        realModuleName => this._tryResolve(
          () => this._loadAsFile(realModuleName),
          () => this._loadAsDir(realModuleName)
        )
      );
    } else {
      return this._redirectRequire(fromModule, toModuleName).then(
        realModuleName => {
          const searchQueue = [];
          for (let currDir = path.dirname(fromModule.path);
               currDir !== '/';
               currDir = path.dirname(currDir)) {
            searchQueue.push(
              path.join(currDir, 'node_modules', realModuleName)
            );
          }

          let p = Promise.reject(new UnableToResolveError('Node module not found'));
          searchQueue.forEach(potentialModulePath => {
            p = this._tryResolve(
              () => this._tryResolve(
                () => p,
                () => this._loadAsFile(potentialModulePath),
              ),
              () => this._loadAsDir(potentialModulePath)
            );
          });

          return p;
        });
    }
  }

  _loadAsFile(potentialModulePath) {
    return Promise.resolve().then(() => {
      if (this._helpers.isAssetFile(potentialModulePath)) {
        const {name, type} = getAssetDataFromName(potentialModulePath);

        let pattern = '^' + name + '(@[\\d\\.]+x)?';
        if (this._platform != null) {
          pattern += '(\\.' + this._platform + ')?';
        }
        pattern += '\\.' + type;

        // We arbitrarly grab the first one, because scale selection
        // will happen somewhere
        const [assetFile] = this._fastfs.matches(
          path.dirname(potentialModulePath),
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
      } else if (this._fastfs.fileExists(potentialModulePath + '.js')) {
        file = potentialModulePath + '.js';
      } else if (this._fastfs.fileExists(potentialModulePath + '.json')) {
        file = potentialModulePath + '.json';
      } else {
        throw new UnableToResolveError(`File ${potentialModulePath} doesnt exist`);
      }

      return this._moduleCache.getModule(file);
    });
  }

  _loadAsDir(potentialDirPath) {
    return Promise.resolve().then(() => {
      if (!this._fastfs.dirExists(potentialDirPath)) {
        throw new UnableToResolveError(`Invalid directory ${potentialDirPath}`);
      }

      const packageJsonPath = path.join(potentialDirPath, 'package.json');
      if (this._fastfs.fileExists(packageJsonPath)) {
        return this._moduleCache.getPackage(packageJsonPath)
          .getMain().then(
            (main) => this._tryResolve(
              () => this._loadAsFile(main),
              () => this._loadAsDir(main)
            )
          );
      }

      return this._loadAsFile(path.join(potentialDirPath, 'index'));
    });
  }

  _resetResolutionCache() {
    this._immediateResolutionCache = Object.create(null);
  }
}


function resolutionHash(modulePath, depName) {
  return `${path.resolve(modulePath)}:${depName}`;
}


function UnableToResolveError() {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  var msg = util.format.apply(util, arguments);
  this.message = msg;
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


module.exports = ResolutionRequest;
