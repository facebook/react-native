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

const EventEmitter = require('events');

const parsePlatformFilePath = require('../lib/parsePlatformFilePath');
const path = require('path');
const throat = require('throat');

const GENERIC_PLATFORM = 'generic';
const NATIVE_PLATFORM = 'native';
const PACKAGE_JSON = path.sep + 'package.json';

import type {Moduleish, Packageish, ModuleishCache} from './ResolutionRequest';
import type DependencyGraphHelpers from './DependencyGraphHelpers';

type Options<TModule, TPackage> = {|
  extensions: Array<string>,
  files: Array<string>,
  helpers: DependencyGraphHelpers,
  moduleCache: ModuleishCache<TModule, TPackage>,
  platforms: Set<string>,
  preferNativePlatform: boolean,
|};

class HasteMap<TModule: Moduleish, TPackage: Packageish> extends EventEmitter {

  _extensions: Array<string>;
  _files: Array<string>;
  _helpers: DependencyGraphHelpers;
  _map: {};
  _moduleCache: ModuleishCache<TModule, TPackage>;
  _packages: {};
  _platforms: Set<string>;
  _preferNativePlatform: boolean;

  constructor({
    extensions,
    files,
    helpers,
    moduleCache,
    platforms,
    preferNativePlatform,
  }: Options<TModule, TPackage>) {
    super();
    this._extensions = extensions;
    this._files = files;
    this._helpers = helpers;
    this._moduleCache = moduleCache;
    this._platforms = platforms;
    this._preferNativePlatform = preferNativePlatform;

    (this: any)._processHastePackage = throat(1, this._processHastePackage.bind(this));
    (this: any)._processHasteModule = throat(1, this._processHasteModule.bind(this));
  }

  build() {
    this._map = Object.create(null);
    this._packages = Object.create(null);
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

  getAllFiles(): Array<string> {
    return this._files;
  }

  processFileChange(type: string, absPath: string) {
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

  getModule(name: string, platform: ?string): ?TModule {
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

  getPackage(name: string): TPackage {
    return this._packages[name];
  }

  _processHasteModule(file: string, previousName: ?string) {
    const module = this._moduleCache.getModule(file);
    return Promise.resolve().then(() => {
      const isHaste = module.isHaste();
      return isHaste && module.getName()
        .then(name => {
          const result = this._updateHasteMap(name, module);
          if (previousName && name !== previousName) {
            this.emit('change');
          }
          return result;
        });
    });
  }

  _processHastePackage(file: string, previousName: ?string) {
    const p = this._moduleCache.getPackage(file);
    return Promise.resolve().then(() => {
      const isHaste = p.isHaste();
      return isHaste && p.getName()
        .then(name => {
          const result = this._updateHasteMap(name, p);
          if (previousName && name !== previousName) {
            this.emit('change');
          }
          return result;
        });
    }).catch(e => {
      if (e instanceof SyntaxError) {
        // Malformed package.json.
        return;
      }
      throw e;
    });
  }

  _updateHasteMap(name: string, mod: TModule | TPackage) {
    let existingModule;

    if (mod.type === 'Package') {
      existingModule = this._packages[name];
      this._packages[name] = mod;
    } else {
      if (this._map[name] == null) {
        this._map[name] = Object.create(null);
      }
      const moduleMap = this._map[name];
      const modulePlatform =
        parsePlatformFilePath(mod.path, this._platforms).platform ||
        GENERIC_PLATFORM;
      existingModule = moduleMap[modulePlatform];
      moduleMap[modulePlatform] = mod;
    }

    if (existingModule && existingModule.path !== mod.path) {
      throw new Error(
        `@providesModule naming collision:\n` +
        `  Duplicate module name: ${name}\n` +
        `  Paths: ${mod.path} collides with ${existingModule.path}\n\n` +
        'This error is caused by a @providesModule declaration ' +
        'with the same name across two different files.'
      );
    }
  }
}

module.exports = HasteMap;
