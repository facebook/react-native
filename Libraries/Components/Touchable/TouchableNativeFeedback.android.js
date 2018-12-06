/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const ReactNative = require('ReactNative');
const Touchable = require('Touchable');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const UIManager = require('UIManager');
const View = require('View');

const createReactClass = require('create-react-class');
const ensurePositiveDelayProps = require('ensurePositiveDelayProps');
const processColor = require('processColor');

import type {PressEvent} from 'CoreEventTypes';

const rippleBackgroundPropType = PropTypes.shape({
  type: PropTypes.oneOf(['RippleAndroid']),
  color: PropTypes.number,
  borderless: PropTypes.bool,
});

const themeAttributeBackgroundPropType = PropTypes.shape({
  type: PropTypes.oneOf(['ThemeAttrAndroid']),
  attribute: PropTypes.string.isRequired,
});

const backgroundPropType = PropTypes.oneOfType([
  rippleBackgroundPropType,
  themeAttributeBackgroundPropType,
]);

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

/**
 * A wrapper for making views respond properly to touches (Android only).
 * On Android this component uses native state drawable to display touch
 * feedback.
 *
 * At the moment it only supports having a single View instance as a child
 * node, as it's implemented by replacing that View with another instance of
 * RCTView node with some additional properties set.
 *
 * Background drawable of native feedback touchable can be customized with
 * `background` property.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableNativeFeedback
 *         onPress={this._onPressButton}
 *         background={TouchableNativeFeedback.SelectableBackground()}>
 *       <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
 *         <Text style={{margin: 30}}>Button</Text>
 *       </View>
 *     </TouchableNativeFeedback>
 *   );
 * },
 * ```
 */

const TouchableNativeFeedback = createReactClass({
  displayName: 'TouchableNativeFeedback',
  propTypes: {
    ...TouchableWithoutFeedback.propTypes,

    /**
     * Determines the type of background drawable that's going to be used to
     * display feedback. It takes an object with `type` property and extra data
     * depending on the `type`. It's recommended to use one of the static
     * methods to generate that dictionary.
     */
    background: backgroundPropType,

    /**
     * TV preferred focus (see documentation for the View component).
     */
    hasTVPreferredFocus: PropTypes.bool,

    /**
     * Set to true to add the ripple effect to the foreground of the view, instead of the
     * background. This is useful if one of your child views has a background of its own, or you're
     * e.g. displaying images, and you don't want the ripple to be covered by them.
     *
     * Check TouchableNativeFeedback.canUseNativeForeground() first, as this is only available on
     * Android 6.0 and above. If you try to use this on older versions you will get a warning and
     * fallback to background.
     */
    useForeground: PropTypes.bool,
  },

  statics: {
    /**
     * Creates an object that represents android theme's default background for
     * selectable elements (?android:attr/selectableItemBackground).
     */
    SelectableBackground: function() {
      return {type: 'ThemeAttrAndroid', attribute: 'selectableItemBackground'};
    },
    /**
     * Creates an object that represent android theme's default background for borderless
     * selectable elements (?android:attr/selectableItemBackgroundBorderless).
     * Available on android API level 21+.
     */
    SelectableBackgroundBorderless: function() {
      return {
        type: 'ThemeAttrAndroid',
        attribute: 'selectableItemBackgroundBorderless',
      };
    },
    /**
     * Creates an object that represents ripple drawable with specified color (as a
     * string). If property `borderless` evaluates to true the ripple will
     * render outside of the view bounds (see native actionbar buttons as an
     * example of that behavior). This background type is available on Android
     * API level 21+.
     *
     * @param color The ripple color
     * @param borderless If the ripple can render outside it's bounds
     */
    Ripple: function(color: string, borderless: boolean) {
      return {
        type: 'RippleAndroid',
        color: processColor(color),
        borderless: borderless,
      };
    },

    canUseNativeForeground: function() {
      return Platform.OS === 'android' && Platform.Version >= 23;
    },
  },

  mixins: [Touchable.Mixin],

  getDefaultProps: function() {
    return {
      background: this.SelectableBackground(),
    };
  },

  getInitialState: function() {
    return this.touchableGetInitialState();
  },

  componentDidMount: function() {
    ensurePositiveDelayProps(this.props);
  },

  UNSAFE_componentWillReceiveProps: function(nextProps) {
    ensurePositiveDelayProps(nextProps);
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function(e: PressEvent) {
    this.props.onPressIn && this.props.onPressIn(e);
    this._dispatchPressedStateChange(true);
    if (this.pressInLocation) {
      this._dispatchHotspotUpdate(
        this.pressInLocation.locationX,
        this.pressInLocation.locationY,
      );
    }
  },

  touchableHandleActivePressOut: function(e: PressEvent) {
    this.props.onPressOut && this.props.onPressOut(e);
    this._dispatchPressedStateChange(false);
  },

  touchableHandlePress: function(e: PressEvent) {
    this.props.onPress && this.props.onPress(e);
  },

  touchableHandleLongPress: function(e: PressEvent) {
    this.props.onLongPress && this.props.onLongPress(e);
  },

  touchableGetPressRectOffset: function() {
    // Always make sure to predeclare a constant!
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

  _handleResponderMove: function(e) {
    this.touchableHandleResponderMove(e);
    this._dispatchHotspotUpdate(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY,
    );
  },

  _dispatchHotspotUpdate: function(destX, destY) {
    UIManager.dispatchViewManagerCommand(
      ReactNative.findNodeHandle(this),
      UIManager.getViewManagerConfig('RCTView').Commands.hotspotUpdate,
      [destX || 0, destY || 0],
    );
  },

  _dispatchPressedStateChange: function(pressed) {
    UIManager.dispatchViewManagerCommand(
      ReactNative.findNodeHandle(this),
      UIManager.getViewManagerConfig('RCTView').Commands.setPressed,
      [pressed],
    );
  },

  render: function() {
    const child = React.Children.only(this.props.children);
    let children = child.props.children;
    if (Touchable.TOUCH_TARGET_DEBUG && child.type === View) {
      if (!Array.isArray(children)) {
        children = [children];
      }
      children.push(
        Touchable.renderDebugView({
          color: 'brown',
          hitSlop: this.props.hitSlop,
        }),
      );
    }
    if (
      this.props.useForeground &&
      !TouchableNativeFeedback.canUseNativeForeground()
    ) {
      console.warn(
        'Requested foreground ripple, but it is not available on this version of Android. ' +
          'Consider calling TouchableNativeFeedback.canUseNativeForeground() and using a different ' +
          'Touchable if the result is false.',
      );
    }
    const drawableProp =
      this.props.useForeground &&
      TouchableNativeFeedback.canUseNativeForeground()
        ? 'nativeForegroundAndroid'
        : 'nativeBackgroundAndroid';
    const childProps = {
      ...child.props,
      [drawableProp]: this.props.background,
      accessible: this.props.accessible !== false,
      accessibilityLabel: this.props.accessibilityLabel,
      accessibilityRole: this.props.accessibilityRole,
      accessibilityStates: this.props.accessibilityStates,
      children,
      testID: this.props.testID,
      onLayout: this.props.onLayout,
      hitSlop: this.props.hitSlop,
      isTVSelectable: true,
      hasTVPreferredFocus: this.props.hasTVPreferredFocus,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this
        .touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this._handleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate,
    };

    // We need to clone the actual element so that the ripple background drawable
    // can be applied directly to the background of this element rather than to
    // a wrapper view as done in other Touchable*
    return React.cloneElement(child, childProps);
  },
});

module.exports = TouchableNativeFeedback;
