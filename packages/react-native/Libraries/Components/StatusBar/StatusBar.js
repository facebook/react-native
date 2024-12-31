/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';

import processColor from '../../StyleSheet/processColor';
import Platform from '../../Utilities/Platform';
import NativeStatusBarManagerAndroid from './NativeStatusBarManagerAndroid';
import NativeStatusBarManagerIOS from './NativeStatusBarManagerIOS';
import invariant from 'invariant';
import * as React from 'react';

/**
 * Status bar style
 */
export type StatusBarStyle = $Keys<{
  /**
   * Default status bar style (dark for iOS, light for Android)
   */
  default: string,
  /**
   * Dark background, white texts and icons
   */
  'light-content': string,
  /**
   * Light background, dark texts and icons
   */
  'dark-content': string,
  ...
}>;

/**
 * Status bar animation
 */
export type StatusBarAnimation = $Keys<{
  /**
   * No animation
   */
  none: string,
  /**
   * Fade animation
   */
  fade: string,
  /**
   * Slide animation
   */
  slide: string,
  ...
}>;

type AndroidProps = $ReadOnly<{|
  /**
   * The background color of the status bar.
   * @platform android
   */
  backgroundColor?: ?ColorValue,
  /**
   * If the status bar is translucent.
   * When translucent is set to true, the app will draw under the status bar.
   * This is useful when using a semi transparent status bar color.
   *
   * @platform android
   */
  translucent?: ?boolean,
|}>;

type IOSProps = $ReadOnly<{|
  /**
   * If the network activity indicator should be visible.
   *
   * @platform ios
   */
  networkActivityIndicatorVisible?: ?boolean,
  /**
   * The transition effect when showing and hiding the status bar using the `hidden`
   * prop. Defaults to 'fade'.
   *
   * @platform ios
   */
  showHideTransition?: ?('fade' | 'slide' | 'none'),
|}>;

type Props = $ReadOnly<{|
  ...AndroidProps,
  ...IOSProps,
  /**
   * If the status bar is hidden.
   */
  hidden?: ?boolean,
  /**
   * If the transition between status bar property changes should be animated.
   * Supported for backgroundColor, barStyle and hidden.
   */
  animated?: ?boolean,
  /**
   * Sets the color of the status bar text.
   */
  barStyle?: ?('default' | 'light-content' | 'dark-content'),
|}>;

/**
 * Merges the prop stack with the default values.
 */
function mergePropsStack(
  propsStack: Array<Object>,
  defaultValues: Object,
): Object {
  return propsStack.reduce(
    (prev, cur) => {
      for (const prop in cur) {
        if (cur[prop] != null) {
          prev[prop] = cur[prop];
        }
      }
      return prev;
    },
    {...defaultValues},
  );
}

/**
 * Returns an object to insert in the props stack from the props
 * and the transition/animation info.
 */
function createStackEntry(props: any): any {
  const animated = props.animated ?? false;
  const showHideTransition = props.showHideTransition ?? 'fade';
  return {
    backgroundColor:
      props.backgroundColor != null
        ? {
            value: props.backgroundColor,
            animated,
          }
        : null,
    barStyle:
      props.barStyle != null
        ? {
            value: props.barStyle,
            animated,
          }
        : null,
    translucent: props.translucent,
    hidden:
      props.hidden != null
        ? {
            value: props.hidden,
            animated,
            transition: showHideTransition,
          }
        : null,
    networkActivityIndicatorVisible: props.networkActivityIndicatorVisible,
  };
}

/**
 * Component to control the app status bar.
 *
 * It is possible to have multiple `StatusBar` components mounted at the same
 * time. The props will be merged in the order the `StatusBar` components were
 * mounted.
 *
 * ### Imperative API
 *
 * For cases where using a component is not ideal, there are static methods
 * to manipulate the `StatusBar` display stack. These methods have the same
 * behavior as mounting and unmounting a `StatusBar` component.
 *
 * For example, you can call `StatusBar.pushStackEntry` to update the status bar
 * before launching a third-party native UI component, and then call
 * `StatusBar.popStackEntry` when completed.
 *
 * ```
 * const openThirdPartyBugReporter = async () => {
 *   // The bug reporter has a dark background, so we push a new status bar style.
 *   const stackEntry = StatusBar.pushStackEntry({barStyle: 'light-content'});
 *
 *   // `open` returns a promise that resolves when the UI is dismissed.
 *   await BugReporter.open();
 *
 *   // Don't forget to call `popStackEntry` when you're done.
 *   StatusBar.popStackEntry(stackEntry);
 * };
 * ```
 *
 * There is a legacy imperative API that enables you to manually update the
 * status bar styles. However, the legacy API does not update the internal
 * `StatusBar` display stack, which means that any changes will be overridden
 * whenever a `StatusBar` component is mounted or unmounted.
 *
 * It is strongly advised that you use `pushStackEntry`, `popStackEntry`, or
 * `replaceStackEntry` instead of the static methods beginning with `set`.
 *
 * ### Constants
 *
 * `currentHeight` (Android only) The height of the status bar.
 */
class StatusBar extends React.Component<Props> {
  static _propsStack: Array<any> = [];

  static _defaultProps: any = createStackEntry({
    backgroundColor:
      Platform.OS === 'android'
        ? NativeStatusBarManagerAndroid.getConstants()
            .DEFAULT_BACKGROUND_COLOR ?? 'black'
        : 'black',
    barStyle: 'default',
    translucent: false,
    hidden: false,
    networkActivityIndicatorVisible: false,
  });

  // Timer for updating the native module values at the end of the frame.
  // $FlowFixMe[missing-local-annot]
  static _updateImmediate = null;

  // The current merged values from the props stack.
  // $FlowFixMe[missing-local-annot]
  static _currentValues = null;

  // TODO(janic): Provide a real API to deal with status bar height. See the
  // discussion in #6195.
  /**
   * The current height of the status bar on the device.
   *
   * @platform android
   */
  static currentHeight: ?number =
    Platform.OS === 'android'
      ? NativeStatusBarManagerAndroid.getConstants().HEIGHT
      : null;

  // Provide an imperative API as static functions of the component.
  // See the corresponding prop for more detail.

  /**
   * Show or hide the status bar
   * @param hidden Hide the status bar.
   * @param animation Optional animation when
   *    changing the status bar hidden property.
   */
  static setHidden(hidden: boolean, animation?: StatusBarAnimation) {
    animation = animation || 'none';
    StatusBar._defaultProps.hidden.value = hidden;
    if (Platform.OS === 'ios') {
      NativeStatusBarManagerIOS.setHidden(hidden, animation);
    } else if (Platform.OS === 'android') {
      NativeStatusBarManagerAndroid.setHidden(hidden);
    }
  }

  /**
   * Set the status bar style
   * @param style Status bar style to set
   * @param animated Animate the style change.
   */
  static setBarStyle(style: StatusBarStyle, animated?: boolean) {
    animated = animated || false;
    StatusBar._defaultProps.barStyle.value = style;
    if (Platform.OS === 'ios') {
      NativeStatusBarManagerIOS.setStyle(style, animated);
    } else if (Platform.OS === 'android') {
      NativeStatusBarManagerAndroid.setStyle(style);
    }
  }

  /**
   * DEPRECATED - The status bar network activity indicator is not supported in iOS 13 and later. This will be removed in a future release.
   * @param visible Show the indicator.
   *
   * @deprecated
   */
  static setNetworkActivityIndicatorVisible(visible: boolean) {
    if (Platform.OS !== 'ios') {
      console.warn(
        '`setNetworkActivityIndicatorVisible` is only available on iOS',
      );
      return;
    }
    StatusBar._defaultProps.networkActivityIndicatorVisible = visible;
    NativeStatusBarManagerIOS.setNetworkActivityIndicatorVisible(visible);
  }

  /**
   * Set the background color for the status bar
   * @param color Background color.
   * @param animated Animate the style change.
   */
  static setBackgroundColor(color: string, animated?: boolean): void {
    if (Platform.OS !== 'android') {
      console.warn('`setBackgroundColor` is only available on Android');
      return;
    }
    animated = animated || false;
    StatusBar._defaultProps.backgroundColor.value = color;

    const processedColor = processColor(color);
    if (processedColor == null) {
      console.warn(
        `\`StatusBar.setBackgroundColor\`: Color ${color} parsed to null or undefined`,
      );
      return;
    }
    invariant(
      typeof processedColor === 'number',
      'Unexpected color given for StatusBar.setBackgroundColor',
    );

    NativeStatusBarManagerAndroid.setColor(processedColor, animated);
  }

  /**
   * Control the translucency of the status bar
   * @param translucent Set as translucent.
   */
  static setTranslucent(translucent: boolean) {
    if (Platform.OS !== 'android') {
      console.warn('`setTranslucent` is only available on Android');
      return;
    }
    StatusBar._defaultProps.translucent = translucent;
    NativeStatusBarManagerAndroid.setTranslucent(translucent);
  }

  /**
   * Push a StatusBar entry onto the stack.
   * The return value should be passed to `popStackEntry` when complete.
   *
   * @param props Object containing the StatusBar props to use in the stack entry.
   */
  static pushStackEntry(props: any): any {
    const entry = createStackEntry(props);
    StatusBar._propsStack.push(entry);
    StatusBar._updatePropsStack();
    return entry;
  }

  /**
   * Pop a StatusBar entry from the stack.
   *
   * @param entry Entry returned from `pushStackEntry`.
   */
  static popStackEntry(entry: any) {
    const index = StatusBar._propsStack.indexOf(entry);
    if (index !== -1) {
      StatusBar._propsStack.splice(index, 1);
    }
    StatusBar._updatePropsStack();
  }

  /**
   * Replace an existing StatusBar stack entry with new props.
   *
   * @param entry Entry returned from `pushStackEntry` to replace.
   * @param props Object containing the StatusBar props to use in the replacement stack entry.
   */
  static replaceStackEntry(entry: any, props: any): any {
    const newEntry = createStackEntry(props);
    const index = StatusBar._propsStack.indexOf(entry);
    if (index !== -1) {
      StatusBar._propsStack[index] = newEntry;
    }
    StatusBar._updatePropsStack();
    return newEntry;
  }

  // $FlowFixMe[missing-local-annot]
  _stackEntry = null;

  componentDidMount() {
    // Every time a StatusBar component is mounted, we push it's prop to a stack
    // and always update the native status bar with the props from the top of then
    // stack. This allows having multiple StatusBar components and the one that is
    // added last or is deeper in the view hierarchy will have priority.
    this._stackEntry = StatusBar.pushStackEntry(this.props);
  }

  componentWillUnmount() {
    // When a StatusBar is unmounted, remove itself from the stack and update
    // the native bar with the next props.
    StatusBar.popStackEntry(this._stackEntry);
  }

  componentDidUpdate() {
    this._stackEntry = StatusBar.replaceStackEntry(
      this._stackEntry,
      this.props,
    );
  }

  /**
   * Updates the native status bar with the props from the stack.
   */
  static _updatePropsStack = () => {
    // Send the update to the native module only once at the end of the frame.
    clearImmediate(StatusBar._updateImmediate);
    StatusBar._updateImmediate = setImmediate(() => {
      const oldProps = StatusBar._currentValues;
      const mergedProps = mergePropsStack(
        StatusBar._propsStack,
        StatusBar._defaultProps,
      );

      // Update the props that have changed using the merged values from the props stack.
      if (Platform.OS === 'ios') {
        if (
          !oldProps ||
          oldProps.barStyle.value !== mergedProps.barStyle.value
        ) {
          NativeStatusBarManagerIOS.setStyle(
            mergedProps.barStyle.value,
            mergedProps.barStyle.animated || false,
          );
        }
        if (!oldProps || oldProps.hidden.value !== mergedProps.hidden.value) {
          NativeStatusBarManagerIOS.setHidden(
            mergedProps.hidden.value,
            mergedProps.hidden.animated
              ? mergedProps.hidden.transition
              : 'none',
          );
        }

        if (
          !oldProps ||
          oldProps.networkActivityIndicatorVisible !==
            mergedProps.networkActivityIndicatorVisible
        ) {
          NativeStatusBarManagerIOS.setNetworkActivityIndicatorVisible(
            mergedProps.networkActivityIndicatorVisible,
          );
        }
      } else if (Platform.OS === 'android') {
        //todo(T60684787): Add back optimization to only update bar style and
        //background color if the new value is different from the old value.
        NativeStatusBarManagerAndroid.setStyle(mergedProps.barStyle.value);
        const processedColor = processColor(mergedProps.backgroundColor.value);
        if (processedColor == null) {
          console.warn(
            `\`StatusBar._updatePropsStack\`: Color ${mergedProps.backgroundColor.value} parsed to null or undefined`,
          );
        } else {
          invariant(
            typeof processedColor === 'number',
            'Unexpected color given in StatusBar._updatePropsStack',
          );
          NativeStatusBarManagerAndroid.setColor(
            processedColor,
            mergedProps.backgroundColor.animated,
          );
        }
        if (!oldProps || oldProps.hidden.value !== mergedProps.hidden.value) {
          NativeStatusBarManagerAndroid.setHidden(mergedProps.hidden.value);
        }
        // Activities are not translucent by default, so always set if true.
        if (
          !oldProps ||
          oldProps.translucent !== mergedProps.translucent ||
          mergedProps.translucent
        ) {
          NativeStatusBarManagerAndroid.setTranslucent(mergedProps.translucent);
        }
      }
      // Update the current prop values.
      StatusBar._currentValues = mergedProps;
    });
  };

  render(): React.Node {
    return null;
  }
}

module.exports = StatusBar;
