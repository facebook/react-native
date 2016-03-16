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
const getPontentialPlatformExt = require('../../lib/getPlatformExtension');

class HasteMap {
  constructor({ fastfs, moduleCache, helpers }) {
    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._helpers = helpers;
    this._map = Object.create(null);
  }

  build() {
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
          let modules = this._map[name];
          for (var i = 0; i < modules.length; i++) {
            if (modules[i].path === absPath) {
              modules.splice(i, 1);
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
    if (this._map[name]) {
      const modules = this._map[name];
      if (platform != null) {
        for (let i = 0; i < modules.length; i++) {
          if (getPontentialPlatformExt(modules[i].path) === platform) {
            return modules[i];
          }
        }
      }

      return modules[0];
    }
    return null;
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
      this._map[name] = [];
    }

    if (mod.type === 'Module') {
      // Modules takes precendence over packages.
      this._map[name].unshift(mod);
    } else {
      this._map[name].push(mod);
    }
  }
}

module.exports = HasteMap;
