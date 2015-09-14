/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeMethodsMixin
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTUIManager = NativeModules.UIManager;
var TextInputState = require('TextInputState');

var findNodeHandle = require('findNodeHandle');
var flattenStyle = require('flattenStyle');
var invariant = require('invariant');
var mergeFast = require('mergeFast');
var precomputeStyle = require('precomputeStyle');

type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number
) => void

type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number
) => void


var NativeMethodsMixin = {
  measure: function(callback: MeasureOnSuccessCallback) {
    RCTUIManager.measure(
      findNodeHandle(this),
      mountSafeCallback(this, callback)
    );
  },

  measureLayout: function(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */
  ) {
    RCTUIManager.measureLayout(
      findNodeHandle(this),
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess)
    );
  },

  /**
   * This function sends props straight to native. They will not participate
   * in future diff process, this means that if you do not include them in the
   * next render, they will remain active.
   */
  setNativeProps: function(nativeProps: Object) {
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
    var style = precomputeStyle(flattenStyle(nativeProps.style));

    var props = null;
    if (hasOnlyStyle) {
      props = style;
    } else if (!style) {
      props = nativeProps;
    } else {
      props = mergeFast(nativeProps, style);
    }

    RCTUIManager.updateView(
      findNodeHandle(this),
      this.viewConfig.uiViewClassName,
      props
    );
  },

  focus: function() {
    TextInputState.focusTextInput(findNodeHandle(this));
  },

  blur: function() {
    TextInputState.blurTextInput(findNodeHandle(this));
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
  // hide this from Flow since we can't define these properties outside of
  // __DEV__ without actually implementing them (setting them to undefined
  // isn't allowed by ReactClass)
  var NativeMethodsMixin_DEV = (NativeMethodsMixin: any);
  invariant(
    !NativeMethodsMixin_DEV.componentWillMount &&
    !NativeMethodsMixin_DEV.componentWillReceiveProps,
    'Do not override existing functions.'
  );
  NativeMethodsMixin_DEV.componentWillMount = function () {
    throwOnStylesProp(this, this.props);
  };
  NativeMethodsMixin_DEV.componentWillReceiveProps = function (newProps) {
    throwOnStylesProp(this, newProps);
  };
}

/**
 * In the future, we should cleanup callbacks by cancelling them instead of
 * using this.
 */
var mountSafeCallback = function(context: ReactComponent, callback: ?Function): any {
  return function() {
    if (!callback || (context.isMounted && !context.isMounted())) {
      return;
    }
    return callback.apply(context, arguments);
  };
};

module.exports = NativeMethodsMixin;
