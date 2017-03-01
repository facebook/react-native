 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const EventEmitter = require('events');

const getPlatformExtension = require('../lib/getPlatformExtension');
const path = require('path');
const throat = require('throat');

const GENERIC_PLATFORM = 'generic';
const NATIVE_PLATFORM = 'native';
const PACKAGE_JSON = path.sep + 'package.json';

class HasteMap extends EventEmitter {
  constructor({
    extensions,
    files,
    moduleCache,
    preferNativePlatform,
    helpers,
    platforms,
  }) {
    super();
    this._extensions = extensions;
    this._files = files;
    this._helpers = helpers;
    this._moduleCache = moduleCache;
    this._platforms = platforms;
    this._preferNativePlatform = preferNativePlatform;

    this._processHastePackage = throat(1, this._processHastePackage.bind(this));
    this._processHasteModule = throat(1, this._processHasteModule.bind(this));
  }

  build() {
    this._map = Object.create(null);
    const promises = [];
    this._files.forEach(filePath => {
      if (!this._helpers.isNodeModulesDir(filePath)) {
        if (this._extensions.indexOf(path.extname(filePath).substr(1)) !== -1) {
          promises.push(this._processHasteModule(filePath));
        }
        if (filePath.endsWith(PACKAGE_JSON)) {
          promises.push(this._processHastePackage(filePath));
        }
      }
    });
    return Promise.all(promises).then(() => this._map);
  }

  processFileChange(type, absPath) {
    return Promise.resolve().then(() => {
      /*eslint no-labels: 0 */
      let invalidated;
      if (type === 'delete' || type === 'change') {
        loop: for (const name in this._map) {
          const modulesMap = this._map[name];
          for (const platform in modulesMap) {
            const module = modulesMap[platform];
            if (module.path === absPath) {
              delete modulesMap[platform];
              invalidated = name;
              break loop;
            }
          }
        }

        if (type === 'delete') {
          if (invalidated) {
            this.emit('change');
          }
          return null;
        }
      }

      if (type !== 'delete' && this._extensions.indexOf(this._helpers.extname(absPath)) !== -1) {
        if (path.basename(absPath) === 'package.json') {
          return this._processHastePackage(absPath, invalidated);
        } else {
          return this._processHasteModule(absPath, invalidated);
        }
      }
      return null;
    });
  }

  getModule(name, platform = null) {
    const modulesMap = this._map[name];
    if (modulesMap == null) {
      return null;
    }

    // If platform is 'ios', we prefer .ios.js to .native.js which we prefer to
    // a plain .js file.
    let module;
    if (module == null && platform != null) {
      module = modulesMap[platform];
    }
    if (module == null && this._preferNativePlatform) {
      module = modulesMap[NATIVE_PLATFORM];
    }
    if (module == null) {
      module = modulesMap[GENERIC_PLATFORM];
    }
    return module;
  }

  _processHasteModule(file, previousName) {
    const module = this._moduleCache.getModule(file);
    return module.isHaste().then(
      isHaste => isHaste && module.getName()
        .then(name => {
          const result = this._updateHasteMap(name, module);
          if (previousName && name !== previousName) {
            this.emit('change');
          }
          return result;
        })
    );
  }

  _processHastePackage(file, previousName) {
    const p = this._moduleCache.getPackage(file);
    return p.isHaste()
      .then(isHaste => isHaste && p.getName()
        .then(name => {
          const result = this._updateHasteMap(name, p);
          if (previousName && name !== previousName) {
            this.emit('change');
          }
          return result;
        }))
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
    const modulePlatform = getPlatformExtension(mod.path, this._platforms) || GENERIC_PLATFORM;
    const existingModule = moduleMap[modulePlatform];

    if (existingModule && existingModule.path !== mod.path) {
      throw new Error(
        `@providesModule naming collision:\n` +
        `  Duplicate module name: ${name}\n` +
        `  Paths: ${mod.path} collides with ${existingModule.path}\n\n` +
        'This error is caused by a @providesModule declaration ' +
        'with the same name across two different files.'
      );
    }

    moduleMap[modulePlatform] = mod;
  }
}

module.exports = HasteMap;
