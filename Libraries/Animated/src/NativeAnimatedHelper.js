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

var NativeAnimatedModule = require('NativeModules').NativeAnimatedModule;

var invariant = require('fbjs/lib/invariant');

var __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
var __nativeAnimationIdCount = 1; /* used for started animations */

type EndResult = {finished: bool};
type EndCallback = (result: EndResult) => void;

/**
 * Simple wrappers around NativeANimatedModule to provide flow and autocmplete support for
 * the native module methods
 */
var API = {
  createAnimatedNode: function(tag: number, config: Object): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.createAnimatedNode(tag, config);
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
};

/**
 * Properties allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric property that doesn't need
 * to be updated through the shadow view hierarchy (all non-layout properties). This list is limited
 * to the properties that will perform best when animated off the JS thread.
 */
var PROPS_WHITELIST = {
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

var TRANSFORM_WHITELIST = {
  translateX: true,
  translateY: true,
  scale: true,
  rotate: true,
};

function validateProps(params: Object): void {
  for (var key in params) {
    if (!PROPS_WHITELIST.hasOwnProperty(key)) {
      throw new Error(`Property '${key}' is not supported by native animated module`);
    }
  }
}

function validateTransform(config: Object): void {
  for (var key in config) {
    if (!TRANSFORM_WHITELIST.hasOwnProperty(key)) {
      throw new Error(`Property '${key}' is not supported by native animated module`);
    }
  }
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

module.exports = {
  API,
  validateProps,
  validateStyles,
  validateTransform,
  validateInterpolation,
  generateNewNodeTag,
  generateNewAnimationId,
  assertNativeAnimatedModule,
};
