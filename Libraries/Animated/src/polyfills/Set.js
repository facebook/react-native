/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function SetPolyfill() {
  this._cache = [];
}

SetPolyfill.prototype.add = function(e) {
  if (this._cache.indexOf(e) === -1) {
    this._cache.push(e);
  }
};

SetPolyfill.prototype.forEach = function(cb) {
  this._cache.forEach(cb);
};

module.exports = SetPolyfill;
