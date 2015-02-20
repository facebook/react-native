/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule POPAnimation
 */
'use strict';

var RKPOPAnimationManager = require('NativeModulesDeprecated').RKPOPAnimationManager;
if (!RKPOPAnimationManager) {
  // POP animation isn't available in the OSS fork - this is a temporary
  // workaround to enable its availability to be determined at runtime.
  module.exports = null;
} else {

var ReactPropTypes = require('ReactPropTypes');
var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var getObjectValues = require('getObjectValues');
var invariant = require('invariant');
var merge = require('merge');

var RKTypes = RKPOPAnimationManager.Types;
var RKProperties = RKPOPAnimationManager.Properties;

var Properties = {
  bounds: RKProperties.bounds,
  opacity: RKProperties.opacity,
  position: RKProperties.position,
  positionX: RKProperties.positionX,
  positionY: RKProperties.positionY,
  zPosition: RKProperties.zPosition,
  rotation: RKProperties.rotation,
  rotationX: RKProperties.rotationX,
  rotationY: RKProperties.rotationY,
  scaleX: RKProperties.scaleX,
  scaleXY: RKProperties.scaleXY,
  scaleY: RKProperties.scaleY,
  shadowColor: RKProperties.shadowColor,
  shadowOffset: RKProperties.shadowOffset,
  shadowOpacity: RKProperties.shadowOpacity,
  shadowRadius: RKProperties.shadowRadius,
  size: RKProperties.size,
  subscaleXY: RKProperties.subscaleXY,
  subtranslationX: RKProperties.subtranslationX,
  subtranslationXY: RKProperties.subtranslationXY,
  subtranslationY: RKProperties.subtranslationY,
  subtranslationZ: RKProperties.subtranslationZ,
  translationX: RKProperties.translationX,
  translationXY: RKProperties.translationXY,
  translationY: RKProperties.translationY,
  translationZ: RKProperties.translationZ,
};

var Types = {
  decay: RKTypes.decay,
  easeIn: RKTypes.easeIn,
  easeInEaseOut: RKTypes.easeInEaseOut,
  easeOut: RKTypes.easeOut,
  linear: RKTypes.linear,
  spring: RKTypes.spring,
};

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
  allocateTagForAnimation: function() {
    return ++this.lastUsedTag;
  },

  createAnimation: function(typeName, attrs) {
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

    RKPOPAnimationManager.createAnimationInternal(tag, typeName, attrs);
    return tag;
  },

  createSpringAnimation: function(attrs) {
    return this.createAnimation(this.Types.spring, attrs);
  },

  createDecayAnimation: function(attrs) {
    return this.createAnimation(this.Types.decay, attrs);
  },

  createLinearAnimation: function(attrs) {
    return this.createAnimation(this.Types.linear, attrs);
  },

  createEaseInAnimation: function(attrs) {
    return this.createAnimation(this.Types.easeIn, attrs);
  },

  createEaseOutAnimation: function(attrs) {
    return this.createAnimation(this.Types.easeOut, attrs);
  },

  createEaseInEaseOutAnimation: function(attrs) {
    return this.createAnimation(this.Types.easeInEaseOut, attrs);
  },

  addAnimation: function(nodeHandle, anim, callback) {
    RKPOPAnimationManager.addAnimation(nodeHandle, anim, callback);
  },

  removeAnimation: function(nodeHandle, anim) {
    RKPOPAnimationManager.removeAnimation(nodeHandle, anim);
  },
};

// Make sure that we correctly propagate RKPOPAnimationManager constants
// to POPAnimation
if (__DEV__) {
  var allProperties = merge(
    RKPOPAnimationManager.Properties,
    RKPOPAnimationManager.Properties
  );
  for (var key in allProperties) {
    invariant(
      POPAnimation.Properties[key] === RKPOPAnimationManager.Properties[key],
      'POPAnimation doesn\'t copy property ' + key + ' correctly'
    );
  }

  var allTypes = merge(
    RKPOPAnimationManager.Types,
    RKPOPAnimationManager.Types
  );
  for (var key in allTypes) {
    invariant(
      POPAnimation.Types[key] === RKPOPAnimationManager.Types[key],
      'POPAnimation doesn\'t copy type ' + key + ' correctly'
    );
  }
}

module.exports = POPAnimation;

}
