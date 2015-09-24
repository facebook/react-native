'use strict';

const Module = require('./Module');
const Promise = require('promise');
const getAssetDataFromName = require('../lib/getAssetDataFromName');

class AssetModule_DEPRECATED extends Module {
  constructor(...args) {
    super(...args);
    const {resolution, name} = getAssetDataFromName(this.path);
    this.resolution = resolution;
    this.name = name;
  }

  isHaste() {
    return Promise.resolve(false);
  }

  getName() {
    return Promise.resolve(`image!${this.name}`);
  }

  getDependencies() {
    return Promise.resolve([]);
  }

  getAsyncDependencies() {
    return Promise.resolve([]);
  }

  hash() {
    return `AssetModule_DEPRECATED : ${this.path}`;
  }

  isJSON() {
    return false;
  }

  isAsset_DEPRECATED() {
    return true;
  }

  resolution() {
    return getAssetDataFromName(this.path).resolution;
  }

}

module.exports = AssetModule_DEPRECATED;
