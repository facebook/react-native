/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIManager
 * @flow
 */
'use strict';

var UIManager = require('NativeModules').UIManager;

if (!UIManager.setChildren) {

  /**
   * Index cache (used by setChildren())
   */
  UIManager._cachedIndexArray = function(size) {
    var cachedResult = this._cachedIndexArray._cache[size];
    if (!cachedResult) {
      var arr = [];
      for (var i = 0; i < size; i++) {
        arr[i] = i;
      }
      this._cachedIndexArray._cache[size] = arr;
      return arr;
    } else {
      return cachedResult;
    }
  };
  UIManager._cachedIndexArray._cache = {};

  /**
   * Fallback setChildren() implementation for Android
   */
  UIManager.setChildren = function(containerTag, createdTags) {
    var indexes = this._cachedIndexArray(createdTags.length);
    UIManager.manageChildren(containerTag, null, null, createdTags, indexes, null);
  } 
}

module.exports = UIManager;
