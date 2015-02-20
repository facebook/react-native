/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

var reactModules = ['react', 'react/addons'];

/**
 * Takes a module name (string) and returns true if it refers to a root react
 * module name.
 */
function isReactModuleName(moduleName: string): boolean {
  return reactModules.some(function(reactModuleName) {
    return reactModuleName === moduleName.toLowerCase();
  });
}

module.exports = isReactModuleName;
