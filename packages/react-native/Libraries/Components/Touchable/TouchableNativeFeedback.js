/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PressEvent} from '../../Types/CoreEventTypes';
import typeof TouchableWithoutFeedback from './TouchableWithoutFeedback';

import View from '../../Components/View/View';
import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import {findHostInstance_DEPRECATED} from '../../ReactNative/RendererProxy';
import processColor from '../../StyleSheet/processColor';
import Platform from '../../Utilities/Platform';
import {Commands} from '../View/ViewNativeComponent';
import invariant from 'invariant';
import * as React from 'react';

type Props = $ReadOnly<{
  ...React.ElementConfig<TouchableWithoutFeedback>,

  /**
   * Determines the type of background drawable that's going to be used to
   * display feedback. It takes an object with `type` property and extra data
   * depending on the `type`. It's recommended to use one of the static
   * methods to generate that dictionary.
   */
  background?: ?(
    | $ReadOnly<{
        type: 'ThemeAttrAndroid',
        attribute:
          | 'selectableItemBackground'
          | 'selectableItemBackgroundBorderless',
        rippleRadius: ?number,
      }>
    | $ReadOnly<{
        type: 'RippleAndroid',
        color: ?number,
        borderless: boolean,
        rippleRadius: ?number,
      }>
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
}>;

type State = $ReadOnly<{
  pressability: Pressability,
}>;

class TouchableNativeFeedback extends React.Component<Props, State> {
  /**
   * Creates a value for the `background` prop that uses the Android theme's
   * default background for selectable elements.
   */
  static SelectableBackground: (rippleRadius: ?number) => $ReadOnly<{
    attribute: 'selectableItemBackground',
    type: 'ThemeAttrAndroid',
    rippleRadius: ?number,
  }> = (rippleRadius: ?number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackground',
    rippleRadius,
  });

  /**
   * Creates a value for the `background` prop that uses the Android theme's
   * default background for borderless selectable elements. Requires API 21+.
   */
  static SelectableBackgroundBorderless: (rippleRadius: ?number) => $ReadOnly<{
    attribute: 'selectableItemBackgroundBorderless',
    type: 'ThemeAttrAndroid',
    rippleRadius: ?number,
  }> = (rippleRadius: ?number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
    rippleRadius,
  });

  /**
   * Creates a value for the `background` prop that uses the Android ripple with
   * the supplied color. If `borderless` is true, the ripple will render outside
   * of the view bounds. Requires API 21+.
   */
  static Ripple: (
    color: string,
    borderless: boolean,
    rippleRadius: ?number,
  ) => $ReadOnly<{
    borderless: boolean,
    color: ?number,
    rippleRadius: ?number,
    type: 'RippleAndroid',
  }> = (color: string, borderless: boolean, rippleRadius: ?number) => {
    const processedColor = processColor(color);
    invariant(
      processedColor == null || typeof processedColor === 'number',
      'Unexpected color given for Ripple color',
    );
    return {
      type: 'RippleAndroid',
      // $FlowFixMe[incompatible-type]
      color: processedColor,
      borderless,
      rippleRadius,
    };
  };

  /**
   * Whether `useForeground` is supported.
   */
  static canUseNativeForeground: () => boolean = () =>
    Platform.OS === 'android';

  state: State = {
    pressability: new Pressability(this._createPressabilityConfig()),
  };

  _createPressabilityConfig(): PressabilityConfig {
    const accessibilityStateDisabled =
      this.props['aria-disabled'] ?? this.props.accessibilityState?.disabled;
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled:
        this.props.disabled != null
          ? this.props.disabled
          : accessibilityStateDisabled,
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
          this._dispatchHotspotUpdate(event);
          this._dispatchPressedStateChange(true);
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
      const hostComponentRef = findHostInstance_DEPRECATED(this);
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
      const hostComponentRef = findHostInstance_DEPRECATED(this);
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
    const element = React.Children.only<$FlowFixMe>(this.props.children);
    const children: Array<React.Node> = [element.props.children];
    if (__DEV__) {
      if (element.type === View) {
        children.push(
          <PressabilityDebugView color="brown" hitSlop={this.props.hitSlop} />,
        );
      }
    }

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();

    let _accessibilityState = {
      busy: this.props['aria-busy'] ?? this.props.accessibilityState?.busy,
      checked:
        this.props['aria-checked'] ?? this.props.accessibilityState?.checked,
      disabled:
        this.props['aria-disabled'] ?? this.props.accessibilityState?.disabled,
      expanded:
        this.props['aria-expanded'] ?? this.props.accessibilityState?.expanded,
      selected:
        this.props['aria-selected'] ?? this.props.accessibilityState?.selected,
    };

    _accessibilityState =
      this.props.disabled != null
        ? {
            ..._accessibilityState,
            disabled: this.props.disabled,
          }
        : _accessibilityState;

    const accessibilityValue = {
      max: this.props['aria-valuemax'] ?? this.props.accessibilityValue?.max,
      min: this.props['aria-valuemin'] ?? this.props.accessibilityValue?.min,
      now: this.props['aria-valuenow'] ?? this.props.accessibilityValue?.now,
      text: this.props['aria-valuetext'] ?? this.props.accessibilityValue?.text,
    };

    const accessibilityLiveRegion =
      this.props['aria-live'] === 'off'
        ? 'none'
        : this.props['aria-live'] ?? this.props.accessibilityLiveRegion;

    const accessibilityLabel =
      this.props['aria-label'] ?? this.props.accessibilityLabel;
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
        accessibilityLanguage: this.props.accessibilityLanguage,
        accessibilityLabel: accessibilityLabel,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: _accessibilityState,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        accessibilityValue: accessibilityValue,
        importantForAccessibility:
          this.props['aria-hidden'] === true
            ? 'no-hide-descendants'
            : this.props.importantForAccessibility,
        accessibilityViewIsModal:
          this.props['aria-modal'] ?? this.props.accessibilityViewIsModal,
        accessibilityLiveRegion: accessibilityLiveRegion,
        accessibilityElementsHidden:
          this.props['aria-hidden'] ?? this.props.accessibilityElementsHidden,
        hasTVPreferredFocus: this.props.hasTVPreferredFocus,
        hitSlop: this.props.hitSlop,
        focusable:
          this.props.focusable !== false &&
          this.props.onPress !== undefined &&
          !this.props.disabled,
        nativeID: this.props.id ?? this.props.nativeID,
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

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentDidMount(): mixed {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    this.state.pressability.reset();
  }
}

const getBackgroundProp =
  Platform.OS === 'android'
    ? /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
      (background, useForeground: boolean) =>
        useForeground && TouchableNativeFeedback.canUseNativeForeground()
          ? {nativeForegroundAndroid: background}
          : {nativeBackgroundAndroid: background}
    : /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
      (background, useForeground: boolean) => null;

TouchableNativeFeedback.displayName = 'TouchableNativeFeedback';

module.exports = TouchableNativeFeedback;
