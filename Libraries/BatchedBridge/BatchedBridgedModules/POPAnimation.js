/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule POPAnimation
 * @flow
 */
'use strict';

var RCTPOPAnimationManager = require('NativeModules').POPAnimationManager;
if (!RCTPOPAnimationManager) {
  // POP animation isn't available in the OSS fork - this is a temporary
  // workaround to enable its availability to be determined at runtime.
  module.exports = (null: ?Object);
} else {

var ReactPropTypes = require('ReactPropTypes');
var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var getObjectValues = require('getObjectValues');
var invariant = require('invariant');
var merge = require('merge');

var RCTTypes = RCTPOPAnimationManager.Types;
var RCTProperties = RCTPOPAnimationManager.Properties;

var Properties = {
  bounds: RCTProperties.bounds,
  opacity: RCTProperties.opacity,
  position: RCTProperties.position,
  positionX: RCTProperties.positionX,
  positionY: RCTProperties.positionY,
  zPosition: RCTProperties.zPosition,
  rotation: RCTProperties.rotation,
  rotationX: RCTProperties.rotationX,
  rotationY: RCTProperties.rotationY,
  scaleX: RCTProperties.scaleX,
  scaleXY: RCTProperties.scaleXY,
  scaleY: RCTProperties.scaleY,
  shadowColor: RCTProperties.shadowColor,
  shadowOffset: RCTProperties.shadowOffset,
  shadowOpacity: RCTProperties.shadowOpacity,
  shadowRadius: RCTProperties.shadowRadius,
  size: RCTProperties.size,
  subscaleXY: RCTProperties.subscaleXY,
  subtranslationX: RCTProperties.subtranslationX,
  subtranslationXY: RCTProperties.subtranslationXY,
  subtranslationY: RCTProperties.subtranslationY,
  subtranslationZ: RCTProperties.subtranslationZ,
  translationX: RCTProperties.translationX,
  translationXY: RCTProperties.translationXY,
  translationY: RCTProperties.translationY,
  translationZ: RCTProperties.translationZ,
};

var Types = {
  decay: RCTTypes.decay,
  easeIn: RCTTypes.easeIn,
  easeInEaseOut: RCTTypes.easeInEaseOut,
  easeOut: RCTTypes.easeOut,
  linear: RCTTypes.linear,
  spring: RCTTypes.spring,
};

type Attrs = {
  type?: $Enum<typeof Types>;
  property?: $Enum<typeof Properties>;
  fromValue?: any;
  toValue?: any;
  duration?: any;
  velocity?: any;
  deceleration?: any;
  springBounciness?: any;
  dynamicsFriction?: any;
  dynamicsMass?: any;
  dynamicsTension?: any;
}

var POPAnimation = {
  Types: Types,
  Properties: Properties,

  attributeChecker: createStrictShapeTypeChecker({
    type: ReactPropTypes.oneOf(getObjectValues(Types)),
    property: ReactPropTypes.oneOf(getObjectValues(Properties)),
    fromValue: ReactPropTypes.any,
    toValue: ReactPropTypes.any,
    duration: ReactPropTypes.any,
    velocity: ReactPropTypes.any,
    deceleration: ReactPropTypes.any,
    springBounciness: ReactPropTypes.any,
    dynamicsFriction: ReactPropTypes.any,
    dynamicsMass: ReactPropTypes.any,
    dynamicsTension: ReactPropTypes.any,
  }),

  lastUsedTag: 0,
  allocateTagForAnimation: function(): number {
    return ++this.lastUsedTag;
  },

  createAnimation: function(typeName: number, attrs: Attrs): number {
    var tag = this.allocateTagForAnimation();

    if (__DEV__) {
      POPAnimation.attributeChecker(
        {attrs},
        'attrs',
        'POPAnimation.createAnimation'
      );
      POPAnimation.attributeChecker(
        {attrs: {type: typeName}},
        'attrs',
        'POPAnimation.createAnimation'
      );
    }

    RCTPOPAnimationManager.createAnimationInternal(tag, typeName, attrs);
    return tag;
  },

  createSpringAnimation: function(attrs: Attrs): number {
    return this.createAnimation(this.Types.spring, attrs);
  },

  createDecayAnimation: function(attrs: Attrs): number {
    return this.createAnimation(this.Types.decay, attrs);
  },

  createLinearAnimation: function(attrs: Attrs): number {
    return this.createAnimation(this.Types.linear, attrs);
  },

  createEaseInAnimation: function(attrs: Attrs): number {
    return this.createAnimation(this.Types.easeIn, attrs);
  },

  createEaseOutAnimation: function(attrs: Attrs): number {
    return this.createAnimation(this.Types.easeOut, attrs);
  },

  createEaseInEaseOutAnimation: function(attrs: Attrs): number {
    return this.createAnimation(this.Types.easeInEaseOut, attrs);
  },

  addAnimation: function(nodeHandle: any, anim: number, callback: Function) {
    RCTPOPAnimationManager.addAnimation(nodeHandle, anim, callback);
  },

  removeAnimation: function(nodeHandle: any, anim: number) {
    RCTPOPAnimationManager.removeAnimation(nodeHandle, anim);
  },
};

// Make sure that we correctly propagate RCTPOPAnimationManager constants
// to POPAnimation
if (__DEV__) {
  var allProperties = merge(
    RCTPOPAnimationManager.Properties,
    RCTPOPAnimationManager.Properties
  );
  for (var key in allProperties) {
    invariant(
      POPAnimation.Properties[key] === RCTPOPAnimationManager.Properties[key],
      'POPAnimation doesn\'t copy property ' + key + ' correctly'
    );
  }

  var allTypes = merge(
    RCTPOPAnimationManager.Types,
    RCTPOPAnimationManager.Types
  );
  for (var key in allTypes) {
    invariant(
      POPAnimation.Types[key] === RCTPOPAnimationManager.Types[key],
      'POPAnimation doesn\'t copy type ' + key + ' correctly'
    );
  }
}

module.exports = POPAnimation;

}
