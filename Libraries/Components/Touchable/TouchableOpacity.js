/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Animated = require('Animated');
const Easing = require('Easing');
const Platform = require('Platform');
const React = require('React');
const Touchable = require('Touchable');

const ensurePositiveDelayProps = require('ensurePositiveDelayProps');
const flattenStyle = require('flattenStyle');

import type {BlurEvent, FocusEvent, TouchableState} from 'Touchable';
import type {Props as TouchableWithoutFeedbackProps} from 'TouchableWithoutFeedback';
import type {ViewStyleProp} from 'StyleSheet';
import type {TVParallaxPropertiesType} from 'TVViewPropTypes';
import type {PressEvent} from 'CoreEventTypes';

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

type TVProps = $ReadOnly<{|
  /**
   * TV preferred focus (see documentation for the View component).
   */
  hasTVPreferredFocus?: ?boolean,
  /**
   * TV next focus down (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusDown?: ?number,
  /**
   * TV next focus forward (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusForward?: ?number,
  /**
   * TV next focus left (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusLeft?: ?number,
  /**
   * TV next focus right (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusRight?: ?number,
  /**
   * TV next focus up (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusUp?: ?number,
  /**
   * Apple TV parallax effects
   */
  tvParallaxProperties?: ?TVParallaxPropertiesType,
|}>;

type Props = $ReadOnly<{|
  ...TouchableWithoutFeedbackProps,
  ...TVProps,

  /**
   * Determines what the opacity of the wrapped view should be when touch is
   * active. Defaults to 0.2.
   */
  activeOpacity: number,
  style?: ?ViewStyleProp,
|}>;

type State = {|
  ...TouchableState,

  anim: Animated.Value,
|};

function createTouchMixin(
  node: React.ElementRef<typeof TouchableOpacity>,
): typeof Touchable.MixinWithoutDefaultFocusAndBlur {
  const touchMixin = {...Touchable.MixinWithoutDefaultFocusAndBlur};

  for (const key in touchMixin) {
    if (typeof touchMixin[key] === 'function') {
      touchMixin[key] = touchMixin[key].bind(node);
    }
  }

  return touchMixin;
}

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, dimming it.
 *
 * Opacity is controlled by wrapping the children in an Animated.View, which is
 * added to the view hiearchy.  Be aware that this can affect layout.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableOpacity onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('./myButton.png')}
 *       />
 *     </TouchableOpacity>
 *   );
 * },
 * ```
 * ### Example
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react'
 * import {
 *   AppRegistry,
 *   StyleSheet,
 *   TouchableOpacity,
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
 *    return (
 *      <View style={styles.container}>
 *        <TouchableOpacity
 *          style={styles.button}
 *          onPress={this.onPress}
 *        >
 *          <Text> Touch Here </Text>
 *        </TouchableOpacity>
 *        <View style={[styles.countContainer]}>
 *          <Text style={[styles.countText]}>
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
class TouchableOpacity extends React.Component<Props, State> {
  static defaultProps = {
    activeOpacity: 0.2,
  };

  _touchMixin: typeof Touchable.MixinWithoutDefaultFocusAndBlur = createTouchMixin(
    this,
  );

  _isMounted: boolean;

  constructor(props: Props) {
    super(props);

    const touchMixin = Touchable.MixinWithoutDefaultFocusAndBlur;
    for (const key in touchMixin) {
      if (
        typeof touchMixin[key] === 'function' &&
        (key.startsWith('_') || key.startsWith('touchable'))
      ) {
        // $FlowFixMe - dynamically adding properties to a class
        (this: any)[key] = touchMixin[key].bind(this);
      }
    }

    Object.keys(touchMixin)
      .filter(key => typeof touchMixin[key] !== 'function')
      .forEach(key => {
        // $FlowFixMe - dynamically adding properties to a class
        (this: any)[key] = touchMixin[key];
      });

    this.state = {
      ...this._touchMixin.touchableGetInitialState(),

      anim: new Animated.Value(this._getChildStyleOpacityWithDefault()),
    };
  }

  componentDidMount() {
    ensurePositiveDelayProps(this.props);

    this._touchMixin.componentDidMount();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    ensurePositiveDelayProps(this.props);

    if (this.props.disabled !== prevProps.disabled) {
      this._opacityInactive(250);
    }
  }

  componentWillUnmount() {
    this._touchMixin.componentWillUnmount();
  }

  /**
   * Animate the touchable to a new opacity.
   */
  setOpacityTo(value: number, duration: number) {
    Animated.timing(this.state.anim, {
      toValue: value,
      duration: duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn(e: PressEvent) {
    if (e.dispatchConfig.registrationName === 'onResponderGrant') {
      this._opacityActive(0);
    } else {
      this._opacityActive(150);
    }
    this.props.onPressIn && this.props.onPressIn(e);
  }

  touchableHandleActivePressOut(e: PressEvent) {
    this._opacityInactive(250);
    this.props.onPressOut && this.props.onPressOut(e);
  }

  touchableHandleFocus(e: FocusEvent) {
    if (Platform.isTV) {
      this._opacityActive(150);
    }
    this.props.onFocus && this.props.onFocus(e);
  }

  touchableHandleBlur(e: BlurEvent) {
    if (Platform.isTV) {
      this._opacityInactive(250);
    }
    this.props.onBlur && this.props.onBlur(e);
  }

  touchableHandlePress(e: PressEvent) {
    this.props.onPress && this.props.onPress(e);
  }

  touchableHandleLongPress(e: PressEvent) {
    this.props.onLongPress && this.props.onLongPress(e);
  }

  touchableGetPressRectOffset() {
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  }

  touchableGetHitSlop() {
    return this.props.hitSlop;
  }

  touchableGetHighlightDelayMS() {
    return this.props.delayPressIn || 0;
  }

  touchableGetLongPressDelayMS() {
    return this.props.delayLongPress === 0
      ? 0
      : this.props.delayLongPress || 500;
  }

  touchableGetPressOutDelayMS() {
    return this.props.delayPressOut;
  }

  _opacityActive(duration: number) {
    this.setOpacityTo(this.props.activeOpacity, duration);
  }

  _opacityInactive(duration: number) {
    this.setOpacityTo(this._getChildStyleOpacityWithDefault(), duration);
  }

  _getChildStyleOpacityWithDefault(): number {
    const childStyle = flattenStyle(this.props.style) || {};

    // childStyle.opacity could be an AnimatedNode
    if (typeof childStyle.opacity !== 'number') {
      return 1;
    }

    return childStyle.opacity == null ? 1 : childStyle.opacity;
  }

  render() {
    return (
      <Animated.View
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityStates={this.props.accessibilityStates}
        style={[this.props.style, {opacity: this.state.anim}]}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
        onLayout={this.props.onLayout}
        isTVSelectable={true}
        nextFocusDown={this.props.nextFocusDown}
        nextFocusForward={this.props.nextFocusForward}
        nextFocusLeft={this.props.nextFocusLeft}
        nextFocusRight={this.props.nextFocusRight}
        nextFocusUp={this.props.nextFocusUp}
        hasTVPreferredFocus={this.props.hasTVPreferredFocus}
        tvParallaxProperties={this.props.tvParallaxProperties}
        hitSlop={this.props.hitSlop}
        onStartShouldSetResponder={
          this._touchMixin.touchableHandleStartShouldSetResponder
        }
        onResponderTerminationRequest={
          this._touchMixin.touchableHandleResponderTerminationRequest
        }
        onResponderGrant={this._touchMixin.touchableHandleResponderGrant}
        onResponderMove={this._touchMixin.touchableHandleResponderMove}
        onResponderRelease={this._touchMixin.touchableHandleResponderRelease}
        onResponderTerminate={
          this._touchMixin.touchableHandleResponderTerminate
        }>
        {this.props.children}
        {Touchable.renderDebugView({
          color: 'cyan',
          hitSlop: this.props.hitSlop,
        })}
      </Animated.View>
    );
  }
}

module.exports = TouchableOpacity;
