/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchableWithoutFeedback
 * @flow
 */
'use strict';

var React = require('React');
var Touchable = require('Touchable');

var onlyChild = require('onlyChild');

/**
 * When the scroll view is disabled, this defines how far your touch may move
 * off of the button, before deactivating the button. Once deactivated, try
 * moving it back and you'll see that the button is once again reactivated!
 * Move it back and forth several times while the scroll view is disabled.
 */
var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

type Event = Object;

/**
 * Do not use unless you have a very good reason. All the elements that
 * respond to press should have a visual feedback when touched. This is
 * one of the primary reason a "web" app doesn't feel "native".
 */
var TouchableWithoutFeedback = React.createClass({
  mixins: [Touchable.Mixin],

  propTypes: {
    /**
     * Called when the touch is released, but not if cancelled (e.g. by a scroll
     * that steals the responder lock).
     */
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
  touchableHandlePress: function(e: Event) {
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

  touchableGetPressRectOffset: function(): typeof PRESS_RECT_OFFSET {
    return PRESS_RECT_OFFSET;   // Always make sure to predeclare a constant!
  },

  touchableGetHighlightDelayMS: function(): number {
    return 0;
  },

  render: function(): ReactElement {
    // Note(vjeux): use cloneWithProps once React has been upgraded
    var child = onlyChild(this.props.children);
    // Note(avik): remove dynamic typecast once Flow has been upgraded
    return (React: any).cloneElement(child, {
      accessible: true,
      testID: this.props.testID,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this.touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate
    });
  }
});

module.exports = TouchableWithoutFeedback;
