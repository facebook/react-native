/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var Promise = require('bluebird');
var isAbsolutePath = require('absolute-path');

function ModuleDescriptor(fields) {
  if (!fields.id) {
    throw new Error('Missing required fields id');
  }
  this.id = fields.id;

  if (!fields.path) {
    throw new Error('Missing required fields path');
  }
  if (!isAbsolutePath(fields.path)) {
    throw new Error('Expected absolute path but found: ' + fields.path);
  }
  this.path = fields.path;

  this.dependencies = fields.dependencies;

  this.isPolyfill = fields.isPolyfill || false;

  this.isAsset_DEPRECATED = fields.isAsset_DEPRECATED || false;
  this.isAsset = fields.isAsset || false;

  if (this.isAsset_DEPRECATED && this.isAsset) {
    throw new Error('Cannot be an asset and a deprecated asset');
  }

  this.resolution = fields.resolution;

  if (this.isAsset && isNaN(this.resolution)) {
    throw new Error('Expected resolution to be a number for asset modules');
  }

  this.altId = fields.altId;

  this.isJSON = fields.isJSON;

  this._fields = fields;
}

ModuleDescriptor.prototype.loadDependencies = function(loader) {
  if (!this.dependencies) {
    if (this._loadingDependencies) {
      return this._loadingDependencies;
    }

    var self = this;
    this._loadingDependencies = loader(this).then(function(dependencies) {
      self.dependencies = dependencies;
    });
    return this._loadingDependencies;
  }

  return Promise.resolve(this.dependencies);
};

ModuleDescriptor.prototype.toJSON = function() {
  var ret = {};
  Object.keys(this).forEach(function(prop) {
    if (prop[0] !== '_' && typeof this[prop] !== 'function') {
      ret[prop] = this[prop];
    }
  }, this);
  return ret;
};

module.exports = ModuleDescriptor;
