/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TouchableBounce
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var POPAnimation = require('POPAnimation');
var Animation = require('Animation');
var Touchable = require('Touchable');

var merge = require('merge');
var copyProperties = require('copyProperties');
var onlyChild = require('onlyChild');

/**
 * When the scroll view is disabled, this defines how far your touch may move
 * off of the button, before deactivating the button. Once deactivated, try
 * moving it back and you'll see that the button is once again reactivated!
 * Move it back and forth several times while the scroll view is disabled.
 */
var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};
/**
 * Example of using the `TouchableMixin` to play well with other responder
 * locking views including `ScrollView`. `TouchableMixin` provides touchable
 * hooks (`this.touchableHandle*`) that we forward events to. In turn,
 * `TouchableMixin` expects us to implement some abstract methods to handle
 * interesting interactions such as `handleTouchablePress`.
 */
var TouchableBounce = React.createClass({
  mixins: [Touchable.Mixin, NativeMethodsMixin],

  propTypes: {
    onPress: React.PropTypes.func,
    // The function passed takes a callback to start the animation which should
    // be run after this onPress handler is done. You can use this (for example)
    // to update UI before starting the animation.
    onPressWithCompletion: React.PropTypes.func,
    // the function passed is called after the animation is complete
    onPressAnimationComplete: React.PropTypes.func,
  },

  getInitialState: function() {
    return merge(this.touchableGetInitialState(), {animationID: null});
  },

  bounceTo: function(value, velocity, bounciness, fromValue, callback) {
    if (POPAnimation) {
      this.state.animationID && this.removeAnimation(this.state.animationID);
      var anim = {
        property: POPAnimation.Properties.scaleXY,
        dynamicsTension: 0,
        toValue: [value, value],
        velocity: [velocity, velocity],
        springBounciness: bounciness,
      };
      if (fromValue) {
        anim.fromValue = [fromValue, fromValue];
      }
      this.state.animationID = POPAnimation.createSpringAnimation(anim);
      this.addAnimation(this.state.animationID, callback);
    } else {
      Animation.startAnimation(this, 300, 0, 'easeOutBack', {scaleXY: [value, value]});
      if (fromValue && typeof fromValue === 'function') {
        callback = fromValue;
      }
      if (callback) {
        setTimeout(callback, 300);
      }
    }
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function() {
    this.bounceTo(0.93, 0.1, 0);
  },

  touchableHandleActivePressOut: function() {
    this.bounceTo(1, 0.4, 0);
  },

  touchableHandlePress: function() {
    if (this.props.onPressWithCompletion) {
      this.props.onPressWithCompletion(
        this.bounceTo.bind(this, 1, 10, 10, 0.93, this.props.onPressAnimationComplete)
      );
      return;
    }

    this.bounceTo(1, 10, 10, undefined, this.props.onPressAnimationComplete);
    this.props.onPress && this.props.onPress();
  },

  touchableGetPressRectOffset: function() {
    return PRESS_RECT_OFFSET;   // Always make sure to predeclare a constant!
  },

  touchableGetHighlightDelayMS: function() {
    return 0;
  },

  render: function() {
    // Note(vjeux): use cloneWithProps once React has been upgraded
    var child = onlyChild(this.props.children);
    copyProperties(child.props, {
      accessible: true,
      testID: this.props.testID,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this.touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate
    });
    return child;
  }
});

module.exports = TouchableBounce;
