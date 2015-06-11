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

var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactNativeMount = require('ReactNativeMount');
var ReactNativeTagHandles = require('ReactNativeTagHandles');

function traverseOwnerTreeUp(hierarchy, instance) {
  if (instance) {
    hierarchy.unshift(instance);
    traverseOwnerTreeUp(hierarchy, instance._currentElement._owner);
  }
}

function findInstance(component, targetID) {
  if (targetID === findRootNodeID(component)) {
    return component;
  }
  if (component._renderedComponent) {
    return findInstance(component._renderedComponent, targetID);
  } else {
    for (var key in component._renderedChildren) {
      var child = component._renderedChildren[key];
      if (ReactInstanceHandles.isAncestorIDOf(findRootNodeID(child), targetID)) {
        var instance = findInstance(child, targetID);
        if (instance) {
          return instance;
        }
      }
    }
  }
}

function findRootNodeID(component) {
  var internalInstance = ReactInstanceMap.get(component);
  return internalInstance ? internalInstance._rootNodeID : component._rootNodeID;
}

function findInstanceByNativeTag(rootTag, nativeTag) {
  var containerID = ReactNativeTagHandles.tagToRootNodeID[rootTag];
  var rootInstance = ReactNativeMount._instancesByContainerID[containerID];
  var targetID = ReactNativeTagHandles.tagToRootNodeID[nativeTag];
  if (!targetID) {
    return undefined;
  }
  return findInstance(rootInstance, targetID);
}

function getOwnerHierarchy(instance) {
  var hierarchy = [];
  traverseOwnerTreeUp(hierarchy, instance);
  return hierarchy;
}

module.exports = {findInstanceByNativeTag, getOwnerHierarchy};
