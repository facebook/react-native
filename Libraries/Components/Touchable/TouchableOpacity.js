/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchableOpacity
 */
'use strict';

// Note (avik): add @flow when Flow supports spread properties in propTypes

var NativeMethodsMixin = require('NativeMethodsMixin');
var POPAnimationMixin = require('POPAnimationMixin');
var React = require('React');
var Touchable = require('Touchable');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');

var cloneWithProps = require('cloneWithProps');
var ensureComponentIsNative = require('ensureComponentIsNative');
var keyOf = require('keyOf');
var onlyChild = require('onlyChild');

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, dimming it.
 * This is done without actually changing the view hierarchy, and in general is
 * easy to add to an app without weird side-effects.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableOpacity onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('image!myButton')}
 *       />
 *     </View>
 *   );
 * },
 * ```
 */

var TouchableOpacity = React.createClass({
  mixins: [Touchable.Mixin, NativeMethodsMixin, POPAnimationMixin],

  propTypes: {
    ...TouchableWithoutFeedback.propTypes,
    /**
     * Determines what the opacity of the wrapped view should be when touch is
     * active.
     */
    activeOpacity: React.PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      activeOpacity: 0.5,
    };
  },

  getInitialState: function() {
    return this.touchableGetInitialState();
  },

  componentDidMount: function() {
    ensureComponentIsNative(this.refs[CHILD_REF]);
  },

  componentDidUpdate: function() {
    ensureComponentIsNative(this.refs[CHILD_REF]);
  },

  setOpacityTo: function(value) {
    if (POPAnimationMixin) {
      // Reset with animation if POP is available
      this.stopAllAnimations();
      var anim = {
        type: this.AnimationTypes.linear,
        property: this.AnimationProperties.opacity,
        toValue: value,
      };
      this.startAnimation(CHILD_REF, anim);
    } else {
      // Reset immediately if POP is unavailable
      this.refs[CHILD_REF].setNativeProps({
        opacity: value
      });
    }
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function() {
    this.refs[CHILD_REF].setNativeProps({
      opacity: this.props.activeOpacity
    });
    this.props.onPressIn && this.props.onPressIn();
  },

  touchableHandleActivePressOut: function() {
    this.setOpacityTo(1.0);
    this.props.onPressOut && this.props.onPressOut();
  },

  touchableHandlePress: function() {
    this.setOpacityTo(1.0);
    this.props.onPress && this.props.onPress();
  },

  touchableHandleLongPress: function() {
    this.props.onLongPress && this.props.onLongPress();
  },

  touchableGetPressRectOffset: function() {
    return PRESS_RECT_OFFSET;   // Always make sure to predeclare a constant!
  },

  touchableGetHighlightDelayMS: function() {
    return 0;
  },

  render: function() {
    return cloneWithProps(onlyChild(this.props.children), {
      ref: CHILD_REF,
      accessible: true,
      testID: this.props.testID,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this.touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate,
    });
  },
});

/**
 * When the scroll view is disabled, this defines how far your touch may move
 * off of the button, before deactivating the button. Once deactivated, try
 * moving it back and you'll see that the button is once again reactivated!
 * Move it back and forth several times while the scroll view is disabled.
 */
var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

var CHILD_REF = keyOf({childRef: null});

module.exports = TouchableOpacity;
