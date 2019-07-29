/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const DeprecatedColorPropType = require('../../DeprecatedPropTypes/DeprecatedColorPropType');
const DeprecatedViewPropTypes = require('../../DeprecatedPropTypes/DeprecatedViewPropTypes');
const NativeMethodsMixin = require('../../Renderer/shims/NativeMethodsMixin');
const Platform = require('../../Utilities/Platform');
const PropTypes = require('prop-types');
const React = require('react');
const ReactNativeViewAttributes = require('../View/ReactNativeViewAttributes');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const Touchable = require('./Touchable');
const TouchableWithoutFeedback = require('./TouchableWithoutFeedback');
const View = require('../View/View');

const createReactClass = require('create-react-class');
const ensurePositiveDelayProps = require('./ensurePositiveDelayProps');

import type {PressEvent} from '../../Types/CoreEventTypes';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {Props as TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';
import type {TVParallaxPropertiesType} from '../AppleTV/TVViewPropTypes';

const DEFAULT_PROPS = {
  activeOpacity: 0.85,
  delayPressOut: 100,
  underlayColor: 'black',
};

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

type IOSProps = $ReadOnly<{|
  hasTVPreferredFocus?: ?boolean,
  tvParallaxProperties?: ?TVParallaxPropertiesType,
|}>;

type AndroidProps = $ReadOnly<{|
  nextFocusDown?: ?number,
  nextFocusForward?: ?number,
  nextFocusLeft?: ?number,
  nextFocusRight?: ?number,
  nextFocusUp?: ?number,
|}>;

type Props = $ReadOnly<{|
  ...TouchableWithoutFeedbackProps,
  ...IOSProps,
  ...AndroidProps,

  activeOpacity?: ?number,
  underlayColor?: ?ColorValue,
  style?: ?ViewStyleProp,
  onShowUnderlay?: ?() => void,
  onHideUnderlay?: ?() => void,
  testOnly_pressed?: ?boolean,
|}>;

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, which allows
 * the underlay color to show through, darkening or tinting the view.
 *
 * The underlay comes from wrapping the child in a new View, which can affect
 * layout, and sometimes cause unwanted visual artifacts if not used correctly,
 * for example if the backgroundColor of the wrapped view isn't explicitly set
 * to an opaque color.
 *
 * TouchableHighlight must have one child (not zero or more than one).
 * If you wish to have several child components, wrap them in a View.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableHighlight onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('./myButton.png')}
 *       />
 *     </TouchableHighlight>
 *   );
 * },
 * ```
 *
 *
 * ### Example
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react'
 * import {
 *   AppRegistry,
 *   StyleSheet,
 *   TouchableHighlight,
 *   Text,
 *   View,
 * } from 'react-native'
 *
 * class App extends Component {
 *   constructor(props) {
 *     super(props)
 *     this.state = { count: 0 }
 *   }
 *
 *   onPress = () => {
 *     this.setState({
 *       count: this.state.count+1
 *     })
 *   }
 *
 *  render() {
 *     return (
 *       <View style={styles.container}>
 *         <TouchableHighlight
 *          style={styles.button}
 *          onPress={this.onPress}
 *         >
 *          <Text> Touch Here </Text>
 *         </TouchableHighlight>
 *         <View style={[styles.countContainer]}>
 *           <Text style={[styles.countText]}>
 *             { this.state.count !== 0 ? this.state.count: null}
 *           </Text>
 *         </View>
 *       </View>
 *     )
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *     justifyContent: 'center',
 *     paddingHorizontal: 10
 *   },
 *   button: {
 *     alignItems: 'center',
 *     backgroundColor: '#DDDDDD',
 *     padding: 10
 *   },
 *   countContainer: {
 *     alignItems: 'center',
 *     padding: 10
 *   },
 *   countText: {
 *     color: '#FF00FF'
 *   }
 * })
 *
 * AppRegistry.registerComponent('App', () => App)
 * ```
 *
 */

const TouchableHighlight = ((createReactClass({
  displayName: 'TouchableHighlight',
  propTypes: {
    /* $FlowFixMe(>=0.89.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.89 was deployed. To see the error, delete this
     * comment and run Flow. */
    ...TouchableWithoutFeedback.propTypes,
    /**
     * Determines what the opacity of the wrapped view should be when touch is
     * active.
     */
    activeOpacity: PropTypes.number,
    /**
     * The color of the underlay that will show through when the touch is
     * active.
     */
    underlayColor: DeprecatedColorPropType,
    /**
     * Style to apply to the container/underlay. Most commonly used to make sure
     * rounded corners match the wrapped component.
     */
    style: DeprecatedViewPropTypes.style,
    /**
     * Called immediately after the underlay is shown
     */
    onShowUnderlay: PropTypes.func,
    /**
     * Called immediately after the underlay is hidden
     */
    onHideUnderlay: PropTypes.func,
    /**
     * *(Apple TV only)* TV preferred focus (see documentation for the View component).
     *
     * @platform ios
     */
    hasTVPreferredFocus: PropTypes.bool,
    /**
     * TV next focus down (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusDown: PropTypes.number,
    /**
     * TV next focus forward (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusForward: PropTypes.number,
    /**
     * TV next focus left (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusLeft: PropTypes.number,
    /**
     * TV next focus right (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusRight: PropTypes.number,
    /**
     * TV next focus up (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusUp: PropTypes.number,
    /**
     * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
     *
     * enabled: If true, parallax effects are enabled.  Defaults to true.
     * shiftDistanceX: Defaults to 2.0.
     * shiftDistanceY: Defaults to 2.0.
     * tiltAngle: Defaults to 0.05.
     * magnification: Defaults to 1.0.
     * pressMagnification: Defaults to 1.0.
     * pressDuration: Defaults to 0.3.
     * pressDelay: Defaults to 0.0.
     *
     * @platform ios
     */
    tvParallaxProperties: PropTypes.object,
    /**
     * Handy for snapshot tests.
     */
    testOnly_pressed: PropTypes.bool,
  },

  mixins: [NativeMethodsMixin, Touchable.Mixin.withoutDefaultFocusAndBlur],

  getDefaultProps: () => DEFAULT_PROPS,

  getInitialState: function() {
    this._isMounted = false;
    if (this.props.testOnly_pressed) {
      return {
        ...this.touchableGetInitialState(),
        extraChildStyle: {
          opacity: this.props.activeOpacity,
        },
        extraUnderlayStyle: {
          backgroundColor: this.props.underlayColor,
        },
      };
    } else {
      return {
        ...this.touchableGetInitialState(),
        extraChildStyle: null,
        extraUnderlayStyle: null,
      };
    }
  },

  componentDidMount: function() {
    this._isMounted = true;
    ensurePositiveDelayProps(this.props);
  },

  componentWillUnmount: function() {
    this._isMounted = false;
    clearTimeout(this._hideTimeout);
  },

  UNSAFE_componentWillReceiveProps: function(nextProps) {
    ensurePositiveDelayProps(nextProps);
  },

  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RCTView,
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function(e: PressEvent) {
    clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    this._showUnderlay();
    this.props.onPressIn && this.props.onPressIn(e);
  },

  touchableHandleActivePressOut: function(e: PressEvent) {
    if (!this._hideTimeout) {
      this._hideUnderlay();
    }
    this.props.onPressOut && this.props.onPressOut(e);
  },

  touchableHandleFocus: function(e: Event) {
    if (Platform.isTV) {
      this._showUnderlay();
    }
    this.props.onFocus && this.props.onFocus(e);
  },

  touchableHandleBlur: function(e: Event) {
    if (Platform.isTV) {
      this._hideUnderlay();
    }
    this.props.onBlur && this.props.onBlur(e);
  },

  touchableHandlePress: function(e: PressEvent) {
    clearTimeout(this._hideTimeout);
    if (!Platform.isTV) {
      this._showUnderlay();
      this._hideTimeout = setTimeout(
        this._hideUnderlay,
        this.props.delayPressOut,
      );
    }
    this.props.onPress && this.props.onPress(e);
  },

  touchableHandleLongPress: function(e: PressEvent) {
    this.props.onLongPress && this.props.onLongPress(e);
  },

  touchableGetPressRectOffset: function() {
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  },

  touchableGetHitSlop: function() {
    return this.props.hitSlop;
  },

  touchableGetHighlightDelayMS: function() {
    return this.props.delayPressIn;
  },

  touchableGetLongPressDelayMS: function() {
    return this.props.delayLongPress;
  },

  touchableGetPressOutDelayMS: function() {
    return this.props.delayPressOut;
  },

  _showUnderlay: function() {
    if (!this._isMounted || !this._hasPressHandler()) {
      return;
    }
    this.setState({
      extraChildStyle: {
        opacity: this.props.activeOpacity,
      },
      extraUnderlayStyle: {
        backgroundColor: this.props.underlayColor,
      },
    });
    this.props.onShowUnderlay && this.props.onShowUnderlay();
  },

  _hideUnderlay: function() {
    clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    if (this.props.testOnly_pressed) {
      return;
    }
    if (this._hasPressHandler()) {
      this.setState({
        extraChildStyle: null,
        extraUnderlayStyle: null,
      });
      this.props.onHideUnderlay && this.props.onHideUnderlay();
    }
  },

  _hasPressHandler: function() {
    return !!(
      this.props.onPress ||
      this.props.onPressIn ||
      this.props.onPressOut ||
      this.props.onLongPress
    );
  },

  render: function() {
    const child = React.Children.only(this.props.children);
    return (
      <View
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityStates={this.props.accessibilityStates}
        accessibilityState={this.props.accessibilityState}
        accessibilityActions={this.props.accessibilityActions}
        onAccessibilityAction={this.props.onAccessibilityAction}
        style={StyleSheet.compose(
          this.props.style,
          this.state.extraUnderlayStyle,
        )}
        onLayout={this.props.onLayout}
        hitSlop={this.props.hitSlop}
        isTVSelectable={true}
        tvParallaxProperties={this.props.tvParallaxProperties}
        hasTVPreferredFocus={this.props.hasTVPreferredFocus}
        nextFocusDown={this.props.nextFocusDown}
        nextFocusForward={this.props.nextFocusForward}
        nextFocusLeft={this.props.nextFocusLeft}
        nextFocusRight={this.props.nextFocusRight}
        nextFocusUp={this.props.nextFocusUp}
        focusable={
          this.props.focusable !== false && this.props.onPress !== undefined
        }
        onClick={this.touchableHandlePress}
        onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
        onResponderTerminationRequest={
          this.touchableHandleResponderTerminationRequest
        }
        onResponderGrant={this.touchableHandleResponderGrant}
        onResponderMove={this.touchableHandleResponderMove}
        onResponderRelease={this.touchableHandleResponderRelease}
        onResponderTerminate={this.touchableHandleResponderTerminate}
        nativeID={this.props.nativeID}
        testID={this.props.testID}>
        {React.cloneElement(child, {
          style: StyleSheet.compose(
            child.props.style,
            this.state.extraChildStyle,
          ),
        })}
        {Touchable.renderDebugView({
          color: 'green',
          hitSlop: this.props.hitSlop,
        })}
      </View>
    );
  },
}): any): React.ComponentType<Props>);

module.exports = TouchableHighlight;
