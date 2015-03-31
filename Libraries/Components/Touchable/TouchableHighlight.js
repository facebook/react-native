/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchableHighlight
 */
'use strict';

// Note (avik): add @flow when Flow supports spread properties in propTypes

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var TimerMixin = require('react-timer-mixin');
var Touchable = require('Touchable');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');

var cloneWithProps = require('cloneWithProps');
var ensureComponentIsNative = require('ensureComponentIsNative');
var keyOf = require('keyOf');
var merge = require('merge');
var onlyChild = require('onlyChild');

var DEFAULT_PROPS = {
  activeOpacity: 0.8,
  underlayColor: 'black',
};

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, which allows
 * the underlay color to show through, darkening or tinting the view.  The
 * underlay comes from adding a view to the view hierarchy, which can sometimes
 * cause unwanted visual artifacts if not used correctly, for example if the
 * backgroundColor of the wrapped view isn't explicitly set to an opaque color.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableHighlight onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('image!myButton')}
 *       />
 *     </TouchableHighlight>
 *   );
 * },
 * ```
 */

var TouchableHighlight = React.createClass({
  propTypes: {
    ...TouchableWithoutFeedback.propTypes,
    /**
     * Determines what the opacity of the wrapped view should be when touch is
     * active.
     */
    activeOpacity: React.PropTypes.number,
    /**
     * The color of the underlay that will show through when the touch is
     * active.
     */
    underlayColor: React.PropTypes.string,
    style: View.propTypes.style,
  },

  mixins: [NativeMethodsMixin, TimerMixin, Touchable.Mixin],

  getDefaultProps: () => DEFAULT_PROPS,

  // Performance optimization to avoid constantly re-generating these objects.
  computeSyntheticState: function(props) {
    return {
      activeProps: {
        style: {
          opacity: props.activeOpacity,
        }
      },
      activeUnderlayProps: {
        style: {
          backgroundColor: props.underlayColor,
        }
      },
      underlayStyle: [
        INACTIVE_UNDERLAY_PROPS.style,
        props.style,
      ]
    };
  },

  getInitialState: function() {
    return merge(
      this.touchableGetInitialState(), this.computeSyntheticState(this.props)
    );
  },

  componentDidMount: function() {
    ensureComponentIsNative(this.refs[CHILD_REF]);
  },

  componentDidUpdate: function() {
    ensureComponentIsNative(this.refs[CHILD_REF]);
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.activeOpacity !== this.props.activeOpacity ||
        nextProps.underlayColor !== this.props.underlayColor ||
        nextProps.style !== this.props.style) {
      this.setState(this.computeSyntheticState(nextProps));
    }
  },

  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactIOSViewAttributes.RCTView
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function() {
    this.clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    this._showUnderlay();
    this.props.onPressIn && this.props.onPressIn();
  },

  touchableHandleActivePressOut: function() {
    if (!this._hideTimeout) {
      this._hideUnderlay();
    }
    this.props.onPressOut && this.props.onPressOut();
  },

  touchableHandlePress: function() {
    this.clearTimeout(this._hideTimeout);
    this._showUnderlay();
    this._hideTimeout = this.setTimeout(this._hideUnderlay, 100);
    this.props.onPress && this.props.onPress();
  },

  touchableHandleLongPress: function() {
    this.props.onLongPress && this.props.onLongPress();
  },

  touchableGetPressRectOffset: function() {
    return PRESS_RECT_OFFSET;   // Always make sure to predeclare a constant!
  },

  _showUnderlay: function() {
    this.refs[UNDERLAY_REF].setNativeProps(this.state.activeUnderlayProps);
    this.refs[CHILD_REF].setNativeProps(this.state.activeProps);
  },

  _hideUnderlay: function() {
    this.clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    if (this.refs[UNDERLAY_REF]) {
      this.refs[CHILD_REF].setNativeProps(INACTIVE_CHILD_PROPS);
      this.refs[UNDERLAY_REF].setNativeProps({
        ...INACTIVE_UNDERLAY_PROPS,
        style: this.state.underlayStyle,
      });
    }
  },

  render: function() {
    return (
      <View
        ref={UNDERLAY_REF}
        style={this.state.underlayStyle}
        onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
        onResponderTerminationRequest={this.touchableHandleResponderTerminationRequest}
        onResponderGrant={this.touchableHandleResponderGrant}
        onResponderMove={this.touchableHandleResponderMove}
        onResponderRelease={this.touchableHandleResponderRelease}
        onResponderTerminate={this.touchableHandleResponderTerminate}>
        {cloneWithProps(
          onlyChild(this.props.children),
          {
            ref: CHILD_REF,
            accessible: true,
            testID: this.props.testID,
          }
        )}
      </View>
    );
  }
});

var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};
var CHILD_REF = keyOf({childRef: null});
var UNDERLAY_REF = keyOf({underlayRef: null});
var INACTIVE_CHILD_PROPS = {
  style: StyleSheet.create({x: {opacity: 1.0}}).x,
};
var INACTIVE_UNDERLAY_PROPS = {
  style: StyleSheet.create({x: {backgroundColor: 'transparent'}}).x,
};

module.exports = TouchableHighlight;
