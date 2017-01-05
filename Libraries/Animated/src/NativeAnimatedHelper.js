/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeAnimatedHelper
 * @flow
 */
'use strict';

const NativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
const NativeEventEmitter = require('NativeEventEmitter');

const invariant = require('fbjs/lib/invariant');

let __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
let __nativeAnimationIdCount = 1; /* used for started animations */

type EndResult = {finished: boolean};
type EndCallback = (result: EndResult) => void;
type EventMapping = {
  nativeEventPath: Array<string>,
  animatedValueTag: number,
};

let nativeEventEmitter;

/**
 * Simple wrappers around NativeAnimatedModule to provide flow and autocmplete support for
 * the native module methods
 */
const API = {
  createAnimatedNode: function(tag: number, config: Object): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.createAnimatedNode(tag, config);
  },
  startListeningToAnimatedNodeValue: function(tag: number) {
    assertNativeAnimatedModule();
    NativeAnimatedModule.startListeningToAnimatedNodeValue(tag);
  },
  stopListeningToAnimatedNodeValue: function(tag: number) {
    assertNativeAnimatedModule();
    NativeAnimatedModule.stopListeningToAnimatedNodeValue(tag);
  },
  connectAnimatedNodes: function(parentTag: number, childTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.connectAnimatedNodes(parentTag, childTag);
  },
  disconnectAnimatedNodes: function(parentTag: number, childTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.disconnectAnimatedNodes(parentTag, childTag);
  },
  startAnimatingNode: function(animationId: number, nodeTag: number, config: Object, endCallback: EndCallback): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.startAnimatingNode(animationId, nodeTag, config, endCallback);
  },
  stopAnimation: function(animationId: number) {
    assertNativeAnimatedModule();
    NativeAnimatedModule.stopAnimation(animationId);
  },
  setAnimatedNodeValue: function(nodeTag: number, value: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.setAnimatedNodeValue(nodeTag, value);
  },
  setAnimatedNodeOffset: function(nodeTag: number, offset: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.setAnimatedNodeOffset(nodeTag, offset);
  },
  flattenAnimatedNodeOffset: function(nodeTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.flattenAnimatedNodeOffset(nodeTag);
  },
  extractAnimatedNodeOffset: function(nodeTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.extractAnimatedNodeOffset(nodeTag);
  },
  connectAnimatedNodeToView: function(nodeTag: number, viewTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.connectAnimatedNodeToView(nodeTag, viewTag);
  },
  disconnectAnimatedNodeFromView: function(nodeTag: number, viewTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.disconnectAnimatedNodeFromView(nodeTag, viewTag);
  },
  dropAnimatedNode: function(tag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.dropAnimatedNode(tag);
  },
  addAnimatedEventToView: function(viewTag: number, eventName: string, eventMapping: EventMapping) {
    assertNativeAnimatedModule();
    NativeAnimatedModule.addAnimatedEventToView(viewTag, eventName, eventMapping);
  },
  removeAnimatedEventFromView(viewTag: number, eventName: string) {
    assertNativeAnimatedModule();
    NativeAnimatedModule.removeAnimatedEventFromView(viewTag, eventName);
  }
};

/**
 * Properties allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric property that doesn't need
 * to be updated through the shadow view hierarchy (all non-layout properties). This list is limited
 * to the properties that will perform best when animated off the JS thread.
 */
const PROPS_WHITELIST = {
  style: {
    opacity: true,
    transform: true,
    /* legacy android transform properties */
    scaleX: true,
    scaleY: true,
    translateX: true,
    translateY: true,
  },
};

const TRANSFORM_WHITELIST = {
  translateX: true,
  translateY: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  perspective: true,
};

function validateProps(params: Object): void {
  for (var key in params) {
    if (!PROPS_WHITELIST.hasOwnProperty(key)) {
      throw new Error(`Property '${key}' is not supported by native animated module`);
    }
  }
}

function validateTransform(configs: Array<Object>): void {
  configs.forEach((config) => {
    if (!TRANSFORM_WHITELIST.hasOwnProperty(config.property)) {
      throw new Error(`Property '${config.property}' is not supported by native animated module`);
    }
  });
}

function validateStyles(styles: Object): void {
  var STYLES_WHITELIST = PROPS_WHITELIST.style || {};
  for (var key in styles) {
    if (!STYLES_WHITELIST.hasOwnProperty(key)) {
      throw new Error(`Style property '${key}' is not supported by native animated module`);
    }
  }
}

function validateInterpolation(config: Object): void {
  var SUPPORTED_INTERPOLATION_PARAMS = {
    inputRange: true,
    outputRange: true,
    extrapolate: true,
    extrapolateRight: true,
    extrapolateLeft: true,
  };
  for (var key in config) {
    if (!SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(key)) {
      throw new Error(`Interpolation property '${key}' is not supported by native animated module`);
    }
  }
}

function generateNewNodeTag(): number {
  return __nativeAnimatedNodeTagCount++;
}

function generateNewAnimationId(): number {
  return __nativeAnimationIdCount++;
}

function assertNativeAnimatedModule(): void {
  invariant(NativeAnimatedModule, 'Native animated module is not available');
}

function isNativeAnimatedAvailable(): boolean {
  return !!NativeAnimatedModule;
}

module.exports = {
  API,
  validateProps,
  validateStyles,
  validateTransform,
  validateInterpolation,
  generateNewNodeTag,
  generateNewAnimationId,
  assertNativeAnimatedModule,
  isNativeAnimatedAvailable,
  get nativeEventEmitter() {
    if (!nativeEventEmitter) {
      nativeEventEmitter = new NativeEventEmitter(NativeAnimatedModule);
    }
    return nativeEventEmitter;
  },
};
