 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const path = require('path');
const getPlatformExtension = require('../../lib/getPlatformExtension');

const GENERIC_PLATFORM = 'generic';

class HasteMap {
  constructor({ fastfs, moduleCache, helpers }) {
    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._helpers = helpers;
    this._map = Object.create(null);
    this._warnedAbout = Object.create(null);
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
      // Rewarn after file changes.
      this._warnedAbout = Object.create(null);

      /*eslint no-labels: 0 */
      if (type === 'delete' || type === 'change') {
        loop: for (let name in this._map) {
          const modulesMap = this._map[name];
          for (let platform in modulesMap) {
            const modules = modulesMap[platform];
            for (var i = 0; i < modules.length; i++) {
              if (modules[i].path === absPath) {
                modules.splice(i, 1);
                break loop;
              }
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
    let modules;
    if (platform == null) {
      modules = modulesMap[GENERIC_PLATFORM];
    } else {
      modules = modulesMap[platform];
      if (modules == null) {
        modules = modulesMap[GENERIC_PLATFORM];
      }
    }

    if (modules == null) {
      return null;
    }

    if (modules.length > 1) {
      if (!this._warnedAbout[name]) {
        this._warnedAbout[name] = true;
        console.warn(
          chalk.yellow(
            '\nWARNING: Found multiple haste modules or packages ' +
            'with the name `%s`. Please fix this by adding it to ' +
            'the blacklist or deleting the modules keeping only one.\n'
          ),
          name,
          modules.map(m => m.path).join('\n'),
        );
      }

      return modules[0];
    }

    return modules[0];
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

    if (!moduleMap[modulePlatform]) {
      moduleMap[modulePlatform] = [];
    }

    moduleMap[modulePlatform].push(mod);
  }
}

module.exports = HasteMap;
