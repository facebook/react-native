 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');
const getPlatformExtension = require('../../lib/getPlatformExtension');
const Promise = require('promise');

const GENERIC_PLATFORM = 'generic';

class HasteMap {
  constructor({ fastfs, moduleCache, helpers }) {
    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._helpers = helpers;
  }

  build() {
    this._map = Object.create(null);

    let promises = this._fastfs.findFilesByExt('js', {
      ignore: (file) => this._helpers.isNodeModulesDir(file)
    }).map(file => this._processHasteModule(file));

    promises = promises.concat(
      this._fastfs.findFilesByName('package.json', {
        ignore: (file) => this._helpers.isNodeModulesDir(file)
      }).map(file => this._processHastePackage(file))
    );

    return Promise.all(promises);
  }

  processFileChange(type, absPath) {
    return Promise.resolve().then(() => {
      /*eslint no-labels: 0 */
      if (type === 'delete' || type === 'change') {
        loop: for (let name in this._map) {
          const modulesMap = this._map[name];
          for (let platform in modulesMap) {
            const module = modulesMap[platform];
            if (module.path === absPath) {
              delete modulesMap[platform];
              break loop;
            }
          }
        }

        if (type === 'delete') {
          return;
        }
      }

      if (this._helpers.extname(absPath) === 'js' ||
          this._helpers.extname(absPath) === 'json') {
        if (path.basename(absPath) === 'package.json') {
          return this._processHastePackage(absPath);
        } else {
          return this._processHasteModule(absPath);
        }
      }
    });
  }

  getModule(name, platform = null) {
    const modulesMap = this._map[name];
    if (modulesMap == null) {
      return null;
    }

    // If no platform is given we choose the generic platform module list.
    // If a platform is given and no modules exist we fallback
    // to the generic platform module list.
    if (platform == null) {
      return modulesMap[GENERIC_PLATFORM];
    } else {
      let module = modulesMap[platform];
      if (module == null) {
        module = modulesMap[GENERIC_PLATFORM];
      }
      return module;
    }
  }

  _processHasteModule(file) {
    const module = this._moduleCache.getModule(file);
    return module.isHaste().then(
      isHaste => isHaste && module.getName()
        .then(name => this._updateHasteMap(name, module))
    );
  }

  _processHastePackage(file) {
    file = path.resolve(file);
    const p = this._moduleCache.getPackage(file, this._fastfs);
    return p.isHaste()
      .then(isHaste => isHaste && p.getName()
            .then(name => this._updateHasteMap(name, p)))
      .catch(e => {
        if (e instanceof SyntaxError) {
          // Malformed package.json.
          return;
        }
        throw e;
      });
  }

  _updateHasteMap(name, mod) {
    if (this._map[name] == null) {
      this._map[name] = Object.create(null);
    }

    const moduleMap = this._map[name];
    const modulePlatform = getPlatformExtension(mod.path) || GENERIC_PLATFORM;

    if (moduleMap[modulePlatform]) {
      throw new Error(
        `Naming collision detected: ${mod.path} ` +
        `collides with ${moduleMap[modulePlatform].path}`
      );
    }

    moduleMap[modulePlatform] = mod;
  }
}

module.exports = HasteMap;
