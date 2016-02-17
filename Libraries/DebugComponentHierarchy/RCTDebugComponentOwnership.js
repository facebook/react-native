/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Utility class to provide the component owner hierarchy to native code for
 * debugging purposes.
 *
 * @providesModule RCTDebugComponentOwnership
 * @flow
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var DebugComponentOwnershipModule = require('NativeModules').DebugComponentOwnershipModule;
var InspectorUtils = require('InspectorUtils');
var ReactNativeTagHandles = require('ReactNativeTagHandles');

function componentToString(component) {
  return component.getName ? component.getName() : 'Unknown';
}

function getRootTagForTag(tag: number): ?number {
  var rootNodeID = ReactNativeTagHandles.tagToRootNodeID[tag];
  if (!rootNodeID) {
    return null;
  }
  var rootID = ReactNativeTagHandles.getNativeTopRootIDFromNodeID(rootNodeID);
  if (!rootID) {
    return null;
  }
  return ReactNativeTagHandles.rootNodeIDToTag[rootID];
}

var RCTDebugComponentOwnership = {

  /**
   * Asynchronously returns the owner hierarchy as an array of strings. Request id is
   * passed along to the native module so that the native module can identify the
   * particular call instance.
   *
   * Example returned owner hierarchy: ['RootView', 'Dialog', 'TitleView', 'Text']
   */
  getOwnerHierarchy: function(requestID: number, tag: number) {
    var rootTag = getRootTagForTag(tag);
    var instance = InspectorUtils.findInstanceByNativeTag(rootTag, tag);
    var ownerHierarchy = instance ?
        InspectorUtils.getOwnerHierarchy(instance).map(componentToString) :
        null;
    DebugComponentOwnershipModule.receiveOwnershipHierarchy(requestID, tag, ownerHierarchy);
  },
};

BatchedBridge.registerCallableModule(
  'RCTDebugComponentOwnership',
  RCTDebugComponentOwnership
);

module.exports = RCTDebugComponentOwnership;
