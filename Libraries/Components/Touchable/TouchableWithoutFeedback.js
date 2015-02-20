/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TouchableWithoutFeedback
 */
'use strict';

var React = require('React');
var Touchable = require('Touchable');
var View = require('View');

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
 * Do not use unless you have a very good reason. All the elements that
 * respond to press should have a visual feedback when touched. This is
 * one of the primary reason a "web" app doesn't feel "native".
 */
var TouchableWithoutFeedback = React.createClass({
  mixins: [Touchable.Mixin],

  propTypes: {
    onPress: React.PropTypes.func,
    onPressIn: React.PropTypes.func,
    onPressOut: React.PropTypes.func,
    onLongPress: React.PropTypes.func,
  },

  getInitialState: function() {
    return this.touchableGetInitialState();
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandlePress: function(e) {
    this.props.onPress && this.props.onPress(e);
  },

  touchableHandleActivePressIn: function() {
    this.props.onPressIn && this.props.onPressIn();
  },

  touchableHandleActivePressOut: function() {
    this.props.onPressOut && this.props.onPressOut();
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

module.exports = TouchableWithoutFeedback;
