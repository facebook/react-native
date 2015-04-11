/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

function ModuleDescriptor(fields) {
  if (!fields.id) {
    throw new Error('Missing required fields id');
  }
  this.id = fields.id;

  if (!fields.path) {
    throw new Error('Missing required fields path');
  }
  this.path = fields.path;

  if (!fields.dependencies) {
    throw new Error('Missing required fields dependencies');
  }
  this.dependencies = fields.dependencies;

  this.resolveDependency = fields.resolveDependency;

  this.entry = fields.entry || false;

  this.isPolyfill = fields.isPolyfill || false;

  this.isAsset_DEPRECATED = fields.isAsset_DEPRECATED || false;
  this.isAsset = fields.isAsset || false;

  if (this.isAsset_DEPRECATED && this.isAsset) {
    throw new Error('Cannot be an asset and a deprecated asset');
  }

  this.altId = fields.altId;

  this._fields = fields;
}

ModuleDescriptor.prototype.toJSON = function() {
  return {
    id: this.id,
    path: this.path,
    dependencies: this.dependencies
  };
};

module.exports = ModuleDescriptor;
