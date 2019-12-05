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

import Pressability from '../../Pressability/Pressability.js';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug.js';
import TVTouchable from './TVTouchable.js';
import typeof TouchableWithoutFeedback from './TouchableWithoutFeedback.js';
import {Commands} from 'react-native/Libraries/Components/View/ViewNativeComponent';
import ReactNative from 'react-native/Libraries/Renderer/shims/ReactNative';
import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import Platform from '../../Utilities/Platform';
import View from '../../Components/View/View';
import processColor from '../../StyleSheet/processColor';
import * as React from 'react';

type Props = $ReadOnly<{|
  ...React.ElementConfig<TouchableWithoutFeedback>,

  /**
   * Determines the type of background drawable that's going to be used to
   * display feedback. It takes an object with `type` property and extra data
   * depending on the `type`. It's recommended to use one of the static
   * methods to generate that dictionary.
   */
  background?: ?(
    | $ReadOnly<{|
        type: 'ThemeAttrAndroid',
        attribute:
          | 'selectableItemBackground'
          | 'selectableItemBackgroundBorderless',
      |}>
    | $ReadOnly<{|
        type: 'RippleAndroid',
        color: ?number,
        borderless: boolean,
      |}>
  ),

  /**
   * TV preferred focus (see documentation for the View component).
   */
  hasTVPreferredFocus?: ?boolean,

  /**
   * TV next focus down (see documentation for the View component).
   */
  nextFocusDown?: ?number,

  /**
   * TV next focus forward (see documentation for the View component).
   */
  nextFocusForward?: ?number,

  /**
   * TV next focus left (see documentation for the View component).
   */
  nextFocusLeft?: ?number,

  /**
   * TV next focus right (see documentation for the View component).
   */
  nextFocusRight?: ?number,

  /**
   * TV next focus up (see documentation for the View component).
   */
  nextFocusUp?: ?number,

  /**
   * Set to true to add the ripple effect to the foreground of the view, instead
   * of the background. This is useful if one of your child views has a
   * background of its own, or you're e.g. displaying images, and you don't want
   * the ripple to be covered by them.
   *
   * Check TouchableNativeFeedback.canUseNativeForeground() first, as this is
   * only available on Android 6.0 and above. If you try to use this on older
   * versions, this will fallback to background.
   */
  useForeground?: ?boolean,
|}>;

type State = $ReadOnly<{|
  pressability: Pressability,
|}>;

class TouchableNativeFeedback extends React.Component<Props, State> {
  /**
   * Creates a value for the `background` prop that uses the Android theme's
   * default background for selectable elements.
   */
  static SelectableBackground: () => $ReadOnly<{|
    attribute: 'selectableItemBackground',
    type: 'ThemeAttrAndroid',
  |}> = () => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackground',
  });

  /**
   * Creates a value for the `background` prop that uses the Android theme's
   * default background for borderless selectable elements. Requires API 21+.
   */
  static SelectableBackgroundBorderless: () => $ReadOnly<{|
    attribute: 'selectableItemBackgroundBorderless',
    type: 'ThemeAttrAndroid',
  |}> = () => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
  });

  /**
   * Creates a value for the `background` prop that uses the Android ripple with
   * the supplied color. If `borderless` is true, the ripple will render outside
   * of the view bounds. Requires API 21+.
   */
  static Ripple: (
    color: string,
    borderless: boolean,
  ) => $ReadOnly<{|
    borderless: boolean,
    color: ?number,
    type: 'RippleAndroid',
  |}> = (color: string, borderless: boolean) => ({
    type: 'RippleAndroid',
    color: processColor(color),
    borderless,
  });

  /**
   * Whether `useForeground` is supported.
   */
  static canUseNativeForeground: () => boolean = () =>
    Platform.OS === 'android' && Platform.Version >= 23;

  _tvTouchable: ?TVTouchable;

  state: State = {
    pressability: new Pressability({
      getHitSlop: () => this.props.hitSlop,
      getLongPressDelayMS: () => {
        if (this.props.delayLongPress != null) {
          const maybeNumber = this.props.delayLongPress;
          if (typeof maybeNumber === 'number') {
            return maybeNumber;
          }
        }
        return 500;
      },
      getPressDelayMS: () => this.props.delayPressIn,
      getPressOutDelayMS: () => this.props.delayPressOut,
      getPressRectOffset: () => this.props.pressRetentionOffset,
      getTouchSoundDisabled: () => this.props.touchSoundDisabled,
      onLongPress: event => {
        if (this.props.onLongPress != null) {
          this.props.onLongPress(event);
        }
      },
      onPress: event => {
        if (this.props.onPress != null) {
          this.props.onPress(event);
        }
      },
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
      onResponderTerminationRequest: () =>
        !this.props.rejectResponderTermination,
      onStartShouldSetResponder: () => !this.props.disabled,
    }),
  };

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
