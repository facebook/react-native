/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NativeMethodsMixin
 */
'use strict';

var NativeModules = require('NativeModules');
var NativeModulesDeprecated = require('NativeModulesDeprecated');
var RCTPOPAnimationManagerDeprecated = NativeModulesDeprecated.RCTPOPAnimationManager;
var RCTUIManager = NativeModules.RCTUIManager;
var RCTUIManagerDeprecated = NativeModulesDeprecated.RCTUIManager;
var TextInputState = require('TextInputState');

var flattenStyle = require('flattenStyle');
var invariant = require('invariant');
var mergeFast = require('mergeFast');

var animationIDInvariant = function(funcName, anim) {
  invariant(
    anim,
    funcName + ' must be called with a valid animation ID returned from' +
    ' POPAnimation.createAnimation, received: "' + anim + '"'
  );
};

var NativeMethodsMixin = {
  addAnimation: function(anim, callback) {
    animationIDInvariant('addAnimation', anim);
    RCTPOPAnimationManagerDeprecated.addAnimation(this.getNodeHandle(), anim, callback);
  },

  removeAnimation: function(anim) {
    animationIDInvariant('removeAnimation', anim);
    RCTPOPAnimationManagerDeprecated.removeAnimation(this.getNodeHandle(), anim);
  },

  measure: function(callback) {
    RCTUIManagerDeprecated.measure(this.getNodeHandle(), callback);
  },

  measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
    RCTUIManager.measureLayout(
      this.getNodeHandle(),
      relativeToNativeNode,
      onFail,
      onSuccess
    );
  },

  /**
   * This function sends props straight to native. They will not participate
   * in future diff process, this means that if you do not include them in the
   * next render, they will remain active.
   */
  setNativeProps: function(nativeProps) {
    // nativeProps contains a style attribute that's going to be flattened
    // and all the attributes expanded in place. In order to make this
    // process do as few allocations and copies as possible, we return
    // one if the other is empty. Only if both have values then we create
    // a new object and merge.
    var hasOnlyStyle = true;
    for (var key in nativeProps) {
      if (key !== 'style') {
        hasOnlyStyle = false;
        break;
      }
    }
    var style = flattenStyle(nativeProps.style);

    var props = null;
    if (hasOnlyStyle) {
      props = style;
    } else if (!style) {
      props = nativeProps;
    } else {
      props = mergeFast(nativeProps, style);
    }

    RCTUIManagerDeprecated.updateView(
      this.getNodeHandle(),
      this.viewConfig.uiViewClassName,
      props
    );
  },

  focus: function() {
    TextInputState.focusTextInput(this.getNodeHandle());
  },

  blur: function() {
    TextInputState.blurTextInput(this.getNodeHandle());
  }
};

function throwOnStylesProp(component, props) {
  if (props.styles !== undefined) {
    var owner = component._owner || null;
    var name = component.constructor.displayName;
    var msg = '`styles` is not a supported property of `' + name + '`, did ' +
      'you mean `style` (singular)?';
    if (owner && owner.constructor && owner.constructor.displayName) {
      msg += '\n\nCheck the `' + owner.constructor.displayName + '` parent ' +
        ' component.';
    }
    throw new Error(msg);
  }
}
if (__DEV__) {
  invariant(
    !NativeMethodsMixin.componentWillMount &&
    !NativeMethodsMixin.componentWillReceiveProps,
    'Do not override existing functions.'
  );
  NativeMethodsMixin.componentWillMount = function () {
    throwOnStylesProp(this, this.props);
  };
  NativeMethodsMixin.componentWillReceiveProps = function (newProps) {
    throwOnStylesProp(this, newProps);
  };
}

module.exports = NativeMethodsMixin;
