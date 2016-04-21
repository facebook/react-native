/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InspectorUtils
 */
'use strict';

var ReactNativeComponentTree = require('ReactNativeComponentTree');

function traverseOwnerTreeUp(hierarchy, instance) {
  if (instance) {
    hierarchy.unshift(instance);
    traverseOwnerTreeUp(hierarchy, instance._currentElement._owner);
  }
}

function findInstanceByNativeTag(rootTag, nativeTag) {
  return ReactNativeComponentTree.getInstanceFromNode(nativeTag);
}

function getOwnerHierarchy(instance) {
  var hierarchy = [];
  traverseOwnerTreeUp(hierarchy, instance);
  return hierarchy;
}

module.exports = {findInstanceByNativeTag, getOwnerHierarchy};
