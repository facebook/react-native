/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @generate-docs
 */

'use strict';

import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import TVTouchable from './TVTouchable';
import typeof TouchableWithoutFeedback from './TouchableWithoutFeedback';
import {Commands} from 'react-native/Libraries/Components/View/ViewNativeComponent';
import ReactNative from 'react-native/Libraries/Renderer/shims/ReactNative';
import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import Platform from '../../Utilities/Platform';
import View from '../../Components/View/View';
import processColor from '../../StyleSheet/processColor';
import * as React from 'react';
import invariant from 'invariant';

type Props = $ReadOnly<{|
  ...React.ElementConfig<TouchableWithoutFeedback>,

  /**
    Determines the type of background drawable that's going to be used to
    display feedback. It takes an object with `type` property and extra data
    depending on the `type`. It's recommended to use one of the static
    methods to generate that dictionary.

    @type backgroundPropType
   */
  background?: ?(
    | $ReadOnly<{|
        type: 'ThemeAttrAndroid',
        attribute:
          | 'selectableItemBackground'
          | 'selectableItemBackgroundBorderless',
        rippleRadius: ?number,
      |}>
    | $ReadOnly<{|
        type: 'RippleAndroid',
        color: ?number,
        borderless: boolean,
        rippleRadius: ?number,
      |}>
  ),

  /**
    TV preferred focus (see documentation for the View component).

    @platform android
   */
  hasTVPreferredFocus?: ?boolean,

  /**
    TV next focus down (see documentation for the View component).

    @platform android
   */
  nextFocusDown?: ?number,

  /**
    TV next focus forward (see documentation for the View component).

    @platform android
   */
  nextFocusForward?: ?number,

  /**
    TV next focus left (see documentation for the View component).

    @platform android
   */
  nextFocusLeft?: ?number,

  /**
    TV next focus right (see documentation for the View component).

    @platform android
   */
  nextFocusRight?: ?number,

  /**
    TV next focus up (see documentation for the View component).

    @platform android
   */
  nextFocusUp?: ?number,

  /**
    Set to true to add the ripple effect to the foreground of the view, instead
    of the background. This is useful if one of your child views has a
    background of its own, or you're e.g. displaying images, and you don't want
    the ripple to be covered by them.

    Check TouchableNativeFeedback.canUseNativeForeground() first, as this is
    only available on Android 6.0 and above. If you try to use this on older
    versions you will get a warning and fallback to background.
   */
  useForeground?: ?boolean,
|}>;

type State = $ReadOnly<{|
  pressability: Pressability,
|}>;

/**
  > If you're looking for a more extensive and future-proof way to handle
  > touch-based input, check out the [Pressable](pressable.md) API.

  A wrapper for making views respond properly to touches (Android only). On
  Android this component uses native state drawable to display touch feedback.

  At the moment it only supports having a single View instance as a child node, as
  it's implemented by replacing that View with another instance of RCTView node
  with some additional properties set.

  Background drawable of native feedback touchable can be customized with
  `background` property.

  ```SnackPlayer name=TouchableNativeFeedback%20Android%20Component%20Example&supportedPlatforms=android
  import React, { useState } from "react";
  import { Text, View, StyleSheet, TouchableNativeFeedback } from "react-native";
  import Constants from "expo-constants";

  const randomHexColor = () => {
    return "#000000".replace(/0/g, function() {
      return (~~(Math.random() * 16)).toString(16);
    });
  };
  const App = () => {
    const [rippleColor, setRippleColor] = useState(randomHexColor());
    const [rippleOverflow, setRippleOverflow] = useState(false);
    return (
      <View style={styles.container}>
        <TouchableNativeFeedback
          onPress={() => {
            setRippleColor(randomHexColor());
            setRippleOverflow(!rippleOverflow);
          }}
          background={TouchableNativeFeedback.Ripple(rippleColor, rippleOverflow)}
        >
          <View style={styles.touchable}>
            <Text style={styles.text}>TouchableNativeFeedback</Text>
          </View>
        </TouchableNativeFeedback>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingTop: Constants.statusBarHeight,
      backgroundColor: "#ecf0f1",
      padding: 8
    },
    touchable: { flex: 0.5, borderColor: "black", borderWidth: 1 },
    text: { alignSelf: "center" }
  });

  export default App;
  ```
 */
class TouchableNativeFeedback extends React.Component<Props, State> {
  /**
    ```jsx
    static SelectableBackground(rippleRadius: ?number)
    ```

    Creates an object that represents android theme's default background for
    selectable elements (?android:attr/selectableItemBackground). `rippleRadius`
    parameter controls the radius of the ripple effect.
   */
  static SelectableBackground: (
    rippleRadius: ?number,
  ) => $ReadOnly<{|
    attribute: 'selectableItemBackground',
    type: 'ThemeAttrAndroid',
    rippleRadius: ?number,
  |}> = (rippleRadius: ?number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackground',
    rippleRadius,
  });

  /**
    ```jsx
    static SelectableBackgroundBorderless(rippleRadius: ?number)
    ```

    Creates an object that represent android theme's default background for
    borderless selectable elements
    (?android:attr/selectableItemBackgroundBorderless). Available on android API
    level 21+. `rippleRadius` parameter controls the radius of the ripple effect.
   */
  static SelectableBackgroundBorderless: (
    rippleRadius: ?number,
  ) => $ReadOnly<{|
    attribute: 'selectableItemBackgroundBorderless',
    type: 'ThemeAttrAndroid',
    rippleRadius: ?number,
  |}> = (rippleRadius: ?number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
    rippleRadius,
  });

  /**
    ```jsx
    static Ripple(color: string, borderless: boolean, rippleRadius: ?number)
    ```

    Creates an object that represents ripple drawable with specified color (as a
    string). If property `borderless` evaluates to true the ripple will render
    outside of the view bounds (see native actionbar buttons as an example of that
    behavior). This background type is available on Android API level 21+.
   */
  static Ripple: (
    /**
      The ripple color
     */
    color: string,
    /**
      If the ripple can render outside its bounds
     */
    borderless: boolean,
    /**
      controls the radius of the ripple effect
     */
    rippleRadius: ?number,
  ) => $ReadOnly<{|
    borderless: boolean,
    color: ?number,
    rippleRadius: ?number,
    type: 'RippleAndroid',
  |}> = (color: string, borderless: boolean, rippleRadius: ?number) => {
    const processedColor = processColor(color);
    invariant(
      processedColor == null || typeof processedColor === 'number',
      'Unexpected color given for Ripple color',
    );
    return {
      type: 'RippleAndroid',
      color: processedColor,
      borderless,
      rippleRadius,
    };
  };

  /**
    ```jsx
    static canUseNativeForeground()
    ```
   */
  static canUseNativeForeground: () => boolean = () =>
    Platform.OS === 'android' && Platform.Version >= 23;

  _tvTouchable: ?TVTouchable;

  state: State = {
    pressability: new Pressability(this._createPressabilityConfig()),
  };

  _createPressabilityConfig(): PressabilityConfig {
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled: this.props.disabled,
      hitSlop: this.props.hitSlop,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      minPressDuration: 0,
      pressRectOffset: this.props.pressRetentionOffset,
      android_disableSound: this.props.touchSoundDisabled,
      onLongPress: this.props.onLongPress,
      onPress: this.props.onPress,
      onPressIn: event => {
        if (Platform.OS === 'android') {
          this._dispatchPressedStateChange(true);
          this._dispatchHotspotUpdate(event);
        }
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressMove: event => {
        if (Platform.OS === 'android') {
          this._dispatchHotspotUpdate(event);
        }
      },
      onPressOut: event => {
        if (Platform.OS === 'android') {
          this._dispatchPressedStateChange(false);
        }
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
    };
  }

  _dispatchPressedStateChange(pressed: boolean): void {
    if (Platform.OS === 'android') {
      const hostComponentRef = ReactNative.findHostInstance_DEPRECATED(this);
      if (hostComponentRef == null) {
        console.warn(
          'Touchable: Unable to find HostComponent instance. ' +
            'Has your Touchable component been unmounted?',
        );
      } else {
        Commands.setPressed(hostComponentRef, pressed);
      }
    }
  }

  _dispatchHotspotUpdate(event: PressEvent): void {
    if (Platform.OS === 'android') {
      const {locationX, locationY} = event.nativeEvent;
      const hostComponentRef = ReactNative.findHostInstance_DEPRECATED(this);
      if (hostComponentRef == null) {
        console.warn(
          'Touchable: Unable to find HostComponent instance. ' +
            'Has your Touchable component been unmounted?',
        );
      } else {
        Commands.hotspotUpdate(
          hostComponentRef,
          locationX ?? 0,
          locationY ?? 0,
        );
      }
    }
  }

  render(): React.Node {
    const element = React.Children.only(this.props.children);
    const children = [element.props.children];
    if (__DEV__) {
      if (element.type === View) {
        children.push(
          <PressabilityDebugView color="brown" hitSlop={this.props.hitSlop} />,
        );
      }
    }

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {
      onBlur,
      onFocus,
      ...eventHandlersWithoutBlurAndFocus
    } = this.state.pressability.getEventHandlers();

    return React.cloneElement(
      element,
      {
        ...eventHandlersWithoutBlurAndFocus,
        ...getBackgroundProp(
          this.props.background === undefined
            ? TouchableNativeFeedback.SelectableBackground()
            : this.props.background,
          this.props.useForeground === true,
        ),
        accessible: this.props.accessible !== false,
        accessibilityHint: this.props.accessibilityHint,
        accessibilityLabel: this.props.accessibilityLabel,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: this.props.accessibilityState,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        accessibilityValue: this.props.accessibilityValue,
        importantForAccessibility: this.props.importantForAccessibility,
        accessibilityLiveRegion: this.props.accessibilityLiveRegion,
        accessibilityViewIsModal: this.props.accessibilityViewIsModal,
        accessibilityElementsHidden: this.props.accessibilityElementsHidden,
        hasTVPreferredFocus: this.props.hasTVPreferredFocus,
        hitSlop: this.props.hitSlop,
        focusable:
          this.props.focusable !== false &&
          this.props.onPress !== undefined &&
          !this.props.disabled,
        nativeID: this.props.nativeID,
        nextFocusDown: this.props.nextFocusDown,
        nextFocusForward: this.props.nextFocusForward,
        nextFocusLeft: this.props.nextFocusLeft,
        nextFocusRight: this.props.nextFocusRight,
        nextFocusUp: this.props.nextFocusUp,
        onLayout: this.props.onLayout,
        testID: this.props.testID,
      },
      ...children,
    );
  }

  componentDidMount(): void {
    if (Platform.isTV) {
      this._tvTouchable = new TVTouchable(this, {
        getDisabled: () => this.props.disabled === true,
        onBlur: event => {
          if (this.props.onBlur != null) {
            this.props.onBlur(event);
          }
        },
        onFocus: event => {
          if (this.props.onFocus != null) {
            this.props.onFocus(event);
          }
        },
        onPress: event => {
          if (this.props.onPress != null) {
            this.props.onPress(event);
          }
        },
      });
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    if (Platform.isTV) {
      if (this._tvTouchable != null) {
        this._tvTouchable.destroy();
      }
    }
    this.state.pressability.reset();
  }
}

const getBackgroundProp =
  Platform.OS === 'android'
    ? (background, useForeground) =>
        useForeground && TouchableNativeFeedback.canUseNativeForeground()
          ? {nativeForegroundAndroid: background}
          : {nativeBackgroundAndroid: background}
    : (background, useForeground) => null;

module.exports = TouchableNativeFeedback;
