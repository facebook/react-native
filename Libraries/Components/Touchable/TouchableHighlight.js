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

const Platform = require('Platform');
const React = require('React');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheet = require('StyleSheet');
const Touchable = require('Touchable');
const View = require('View');

const ensurePositiveDelayProps = require('ensurePositiveDelayProps');

import type {PressEvent} from 'CoreEventTypes';
import type {ViewStyleProp} from 'StyleSheet';
import type {ColorValue} from 'StyleSheetTypes';
import type {BlurEvent, FocusEvent, TouchableState} from 'Touchable';
import type {Props as TouchableWithoutFeedbackProps} from 'TouchableWithoutFeedback';
import type {TVParallaxPropertiesType} from 'TVViewPropTypes';

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

type IOSProps = $ReadOnly<{|
  /**
   * *(Apple TV only)* TV preferred focus (see documentation for the View component).
   *
   * @platform ios
   */
  hasTVPreferredFocus?: boolean,
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
  tvParallaxProperties?: TVParallaxPropertiesType,
|}>;

type AndroidProps = $ReadOnly<{|
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
|}>;

type Props = $ReadOnly<{|
  ...TouchableWithoutFeedbackProps,
  ...IOSProps,
  ...AndroidProps,

  /**
   * Determines what the opacity of the wrapped view should be when touch is
   * active.
   */
  activeOpacity: number,
  /**
   * The color of the underlay that will show through when the touch is
   * active.
   */
  underlayColor: ColorValue,
  /**
   * Delay in ms, from the release of the touch, before onPressOut is called.
   */
  delayPressOut: number,
  /**
   * Style to apply to the container/underlay. Most commonly used to make sure
   * rounded corners match the wrapped component.
   */
  style?: ?ViewStyleProp,
  /**
   * Called immediately after the underlay is shown
   */
  onShowUnderlay?: ?() => void,
  /**
   * Called immediately after the underlay is hidden
   */
  onHideUnderlay?: ?() => void,
  /**
   * Handy for snapshot tests.
   */
  testOnly_pressed?: ?boolean,
|}>;

type State = {|
  ...TouchableState,

  extraChildStyle: ?{
    opacity: number,
  },
  extraUnderlayStyle: ?{|
    backgroundColor: ColorValue,
  |},
|};

function createTouchMixin(
  node: React.ElementRef<typeof TouchableHighlight>,
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
class TouchableHighlight extends React.Component<Props, State> {
  static defaultProps = {
    activeOpacity: 0.85,
    delayPressOut: 100,
    underlayColor: 'black',
  };

  _touchMixin: typeof Touchable.MixinWithoutDefaultFocusAndBlur = createTouchMixin(
    this,
  );

  _isMounted: boolean;

  _hideTimeout: ?TimeoutID;

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

    this._isMounted = false;
    if (this.props.testOnly_pressed) {
      this.state = {
        ...this._touchMixin.touchableGetInitialState(),
        extraChildStyle: {
          opacity: this.props.activeOpacity,
        },
        extraUnderlayStyle: {
          backgroundColor: this.props.underlayColor,
        },
      };
    } else {
      this.state = {
        ...this._touchMixin.touchableGetInitialState(),
        extraChildStyle: null,
        extraUnderlayStyle: null,
      };
    }
  }

  componentDidMount() {
    this._isMounted = true;
    ensurePositiveDelayProps(this.props);

    this._touchMixin.componentDidMount();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    ensurePositiveDelayProps(this.props);
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearTimeout(this._hideTimeout);

    this._touchMixin.componentWillUnmount();
  }

  static viewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RCTView,
  };

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn(e: PressEvent) {
    clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    this._showUnderlay();
    this.props.onPressIn && this.props.onPressIn(e);
  }

  touchableHandleActivePressOut(e: PressEvent) {
    if (!this._hideTimeout) {
      this._hideUnderlay();
    }
    this.props.onPressOut && this.props.onPressOut(e);
  }

  touchableHandleFocus(e: FocusEvent) {
    if (Platform.isTV) {
      this._showUnderlay();
    }
    this.props.onFocus && this.props.onFocus(e);
  }

  touchableHandleBlur(e: BlurEvent) {
    if (Platform.isTV) {
      this._hideUnderlay();
    }
    this.props.onBlur && this.props.onBlur(e);
  }

  touchableHandlePress(e: PressEvent) {
    clearTimeout(this._hideTimeout);
    if (!Platform.isTV) {
      this._showUnderlay();
      this._hideTimeout = setTimeout(
        this._hideUnderlay,
        this.props.delayPressOut,
      );
    }
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
    return this.props.delayPressIn;
  }

  touchableGetLongPressDelayMS() {
    return this.props.delayLongPress;
  }

  touchableGetPressOutDelayMS() {
    return this.props.delayPressOut;
  }

  _showUnderlay() {
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
  }

  _hideUnderlay = () => {
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
  };

  _hasPressHandler() {
    return !!(
      this.props.onPress ||
      this.props.onPressIn ||
      this.props.onPressOut ||
      this.props.onLongPress
    );
  }

  render() {
    const child = React.Children.only(this.props.children);
    return (
      <View
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityStates={this.props.accessibilityStates}
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
        }
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
  }
}

module.exports = TouchableHighlight;
