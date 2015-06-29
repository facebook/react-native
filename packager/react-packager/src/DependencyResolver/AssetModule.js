'use strict';

const Module = require('./Module');
const Promise = require('promise');
const getAssetDataFromName = require('../lib/getAssetDataFromName');

class AssetModule extends Module {

  isHaste() {
    return Promise.resolve(false);
  }

  getDependencies() {
    return Promise.resolve([]);
  }

  _read() {
    return Promise.resolve({});
  }

  getName() {
    return super.getName().then(id => {
      const {name, type} = getAssetDataFromName(this.path);
      return id.replace(/\/[^\/]+$/, `/${name}.${type}`);
    });
  }

  getPlainObject() {
    return this.getName().then(name => this.addReference({
      path: this.path,
      isJSON: false,
      isAsset: true,
      isAsset_DEPRECATED: false,
      isPolyfill: false,
      resolution: getAssetDataFromName(this.path).resolution,
      id: name,
      dependencies: [],
    }));
  }

  hash() {
    return `AssetModule : ${this.path}`;
  }
}

module.exports = AssetModule;
