'use strict';

const AssetModule = require('./AssetModule');
const Package = require('./Package');
const Module = require('./Module');
const path = require('path');

class ModuleCache {

  constructor({
    fastfs,
    cache,
    extractRequires,
    transformCode,
    depGraphHelpers,
  }) {
    this._moduleCache = Object.create(null);
    this._packageCache = Object.create(null);
    this._fastfs = fastfs;
    this._cache = cache;
    this._extractRequires = extractRequires;
    this._transformCode = transformCode;
    this._depGraphHelpers = depGraphHelpers;

    fastfs.on('change', this._processFileChange.bind(this));
  }

  getModule(filePath) {
    filePath = path.resolve(filePath);
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new Module({
        file: filePath,
        fastfs: this._fastfs,
        moduleCache: this,
        cache: this._cache,
        extractor: this._extractRequires,
        transformCode: this._transformCode,
        depGraphHelpers: this._depGraphHelpers,
      });
    }
    return this._moduleCache[filePath];
  }

  getAllModules() {
    return this._moduleCache;
  }

  getAssetModule(filePath) {
    filePath = path.resolve(filePath);
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new AssetModule({
        file: filePath,
        fastfs: this._fastfs,
        moduleCache: this,
        cache: this._cache,
      });
    }
    return this._moduleCache[filePath];
  }

  getPackage(filePath) {
    filePath = path.resolve(filePath);
    if (!this._packageCache[filePath]) {
      this._packageCache[filePath] = new Package({
        file: filePath,
        fastfs: this._fastfs,
        cache: this._cache,
      });
    }
    return this._packageCache[filePath];
  }

  getPackageForModule(module) {
    // TODO(amasad): use ES6 Map.
    if (module.__package) {
      if (this._packageCache[module.__package]) {
        return this._packageCache[module.__package];
      } else {
        delete module.__package;
      }
    }

    const packagePath = this._fastfs.closest(module.path, 'package.json');

    if (!packagePath) {
      return null;
    }

    module.__package = packagePath;
    return this.getPackage(packagePath);
  }

  _processFileChange(type, filePath, root) {
    const absPath = path.join(root, filePath);

    if (this._moduleCache[absPath]) {
      this._moduleCache[absPath].invalidate();
      delete this._moduleCache[absPath];
    }
    if (this._packageCache[absPath]) {
      this._packageCache[absPath].invalidate();
      delete this._packageCache[absPath];
    }
  }
}

module.exports = ModuleCache;
