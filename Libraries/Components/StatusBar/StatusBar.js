/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StatusBar
 * @flow
 */
'use strict';

const React = require('React');
const PropTypes = require('prop-types');
const ColorPropType = require('ColorPropType');
const Platform = require('Platform');

const invariant = require('fbjs/lib/invariant');
const processColor = require('processColor');

const NativeEventEmitter = require('NativeEventEmitter');
const StatusBarManager = require('NativeModules').StatusBarManager;

const StatusBarManagerEventEmitter = new NativeEventEmitter(StatusBarManager);

const FRAME_DID_CHANGE_EVENT = 'statusBarFrameDidChange';

type EventName = $Enum<{
  statusBarFrameDidChange: string,
}>;

var _subscriptions = new Map();

/**
 * Status bar style
 */
export type StatusBarStyle = $Enum<{
  /**
   * Default status bar style (dark for iOS, light for Android)
   */
  'default': string,
  /**
   * Dark background, white texts and icons
   */
  'light-content': string,
  /**
   * Light background, dark texts and icons
   */
  'dark-content': string,
}>;

/**
 * Status bar animation
 */
export type StatusBarAnimation = $Enum<{
  /**
   * No animation
   */
  'none': string,
  /**
   * Fade animation
   */
  'fade': string,
  /**
   * Slide animation
   */
  'slide': string,
}>;

type DefaultProps = {
  animated: boolean,
};

/**
 * Merges the prop stack with the default values.
 */
function mergePropsStack(
  propsStack: Array<Object>,
  defaultValues: Object
): Object {
  return propsStack.reduce((prev, cur) => {
    for (const prop in cur) {
      if (cur[prop] != null) {
        prev[prop] = cur[prop];
      }
    }
    return prev;
  }, Object.assign({}, defaultValues));
}

/**
 * Returns an object to insert in the props stack from the props
 * and the transition/animation info.
 */
function createStackEntry(props: any): any {
  return {
    backgroundColor:
      props.backgroundColor != null
        ? {
            value: props.backgroundColor,
            animated: props.animated,
          }
        : null,
    barStyle:
      props.barStyle != null
        ? {
            value: props.barStyle,
            animated: props.animated,
          }
        : null,
    translucent: props.translucent,
    hidden:
      props.hidden != null
        ? {
            value: props.hidden,
            animated: props.animated,
            transition: props.showHideTransition,
          }
        : null,
    networkActivityIndicatorVisible: props.networkActivityIndicatorVisible,
  };
}

/**
 * Component to control the app status bar.
 *
 * ### Usage with Navigator
 *
 * It is possible to have multiple `StatusBar` components mounted at the same
 * time. The props will be merged in the order the `StatusBar` components were
 * mounted. One use case is to specify status bar styles per route using `Navigator`.
 *
 * ```
 *  <View>
 *    <StatusBar
 *      backgroundColor="blue"
 *      barStyle="light-content"
 *    />
 *    <Navigator
 *      initialRoute={{statusBarHidden: true}}
 *      renderScene={(route, navigator) =>
 *        <View>
 *          <StatusBar hidden={route.statusBarHidden} />
 *          ...
 *        </View>
 *      }
 *    />
 *  </View>
 * ```
 *
 * ### Imperative API
 *
 * For cases where using a component is not ideal, there is also an imperative
 * API exposed as static functions on the component. It is however not recommended
 * to use the static API and the component for the same prop because any value
 * set by the static API will get overriden by the one set by the component in
 * the next render.
 *
 * ### Constants
 *
 * `currentHeight` (Android only) The height of the status bar.
 *
 * ### Frame
 *
 * If you need to know the size of the Status Bar in a reliable cross-platform
 * way you can ask for the Status Bar's frame.
 *
 * A frame object looks something like this:
 * ```js
 * // Recent Android phones
 * {
 *   "top": 0,
 *   "height": 24,
 * }
 * // iPhone
 * {
 *   "top": 0,
 *   "height": 20,
 * }
 * // iPhone with In-Call Status Bar
 * {
 *   "top": 20,
 *   "height": 20,
 * }
 * // Landscape iOS 11 iPhone
 * {
 *   "top": 0,
 *   "height": 0,
 * }
 * // iPhone X
 * {
 *   "top": 0,
 *   "height": 44,
 * }
 *
 * ```
 *
 * * The `height` key is the height of the Status Bar that would overlap the app
 *   if the status bar were translucent.
 * * When iOS' In-Call status bar is displayed the app content is pushed down
 *   instead of increasing the overlapping height. When this happens this offset
 *   is exposed in the `top` key instead of being part of the `height`.
 *
 * If you want the "real height" of the status bar instead of the overlapping
 * height of the status bar you can add these two numbers together `frame.top + frame.height`.
 *
 * To get the current frame you can use `getCurrentFrame` which returns a Promise
 * for the current Status Bar frame.
 *
 * ```js
 * StatusBar.getCurrentFrame()
 *   .then((frame) => {
 *     // frame.top - Overlap offset
 *     // frame.height - Height of the Status Bar overlap
 *   })
 * ```
 *
 * The height of the status bar can change for various reasons. Orientation changes
 * on some platforms, UI elements that expand or push down the status bar, or
 * changes to the device's screen dimensions at runtime.
 *
 * You can listen for these changes with the `statusBarFrameDidChange` event.
 *
 * ```js
 * StatusBar.addEventListener('statusBarFrameDidChange', (frame) => {
 *   ...
 * });
 * ```
 */
class StatusBar extends React.Component<{
  hidden?: boolean,
  animated?: boolean,
  backgroundColor?: string,
  translucent?: boolean,
  barStyle?: 'default' | 'light-content' | 'dark-content',
  networkActivityIndicatorVisible?: boolean,
  showHideTransition?: 'fade' | 'slide',
}> {
  static _propsStack = [];

  static _defaultProps = createStackEntry({
    animated: false,
    showHideTransition: 'fade',
    backgroundColor: 'black',
    barStyle: 'default',
    translucent: false,
    hidden: false,
    networkActivityIndicatorVisible: false,
  });

  // Timer for updating the native module values at the end of the frame.
  static _updateImmediate = null;

  // The current merged values from the props stack.
  static _currentValues = null;

  // TODO(janic): Provide a real API to deal with status bar height. See the
  // discussion in #6195.
  /**
   * The current height of the status bar on the device.
   *
   * @platform android
   */
  static currentHeight = StatusBarManager.HEIGHT;

  /**
   * Get the current frame (top and height) of the Status Bar.
   *
   * Returns a Promise that resolves to a frame object with a `top` and `height`.
   */
  static getCurrentFrame(): Promise<{top: number, height: number}> {
    return StatusBarManager.getCurrentFrame();
  }

  /**
   * Adds an event handler. Supported events:
   *
   * - `statusBarFrameDidChange`: Fires when the status bar frame has changed.
   *   The argument to the event handler is a frame object with the keys:
   *   - `height`: The current height of the status bar.
   *   - `top`: How far the top of the status bar is offset from the top of the
   *     screen. This generally only happens when the iOS In-Call Status Bar is
   *     visible and pushes the app down instead of changing the size.
   */
  static addEventListener(
    eventName: EventName,
    handler: Function
  ): {remove: () => void} {
    invariant(eventName === FRAME_DID_CHANGE_EVENT, `Trying to subscribe to unknown event: "${eventName}"`);

    let listener = StatusBarManagerEventEmitter.addListener(eventName, handler);
    _subscriptions.set(handler, listener);
    return {
      remove: () => StatusBar.removeEventListener(eventName, handler)
    };
  }

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks
   */
  static removeEventListener(
    eventName: EventName,
    handler: Function
  ): void {
    const listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  }


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
      StatusBarManager.setHidden(hidden, animation);
    } else if (Platform.OS === 'android') {
      StatusBarManager.setHidden(hidden);
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
      StatusBarManager.setStyle(style, animated);
    } else if (Platform.OS === 'android') {
      StatusBarManager.setStyle(style);
    }
  }

  /**
   * Control the visibility of the network activity indicator
   * @param visible Show the indicator.
   */
  static setNetworkActivityIndicatorVisible(visible: boolean) {
    if (Platform.OS !== 'ios') {
      console.warn(
        '`setNetworkActivityIndicatorVisible` is only available on iOS'
      );
      return;
    }
    StatusBar._defaultProps.networkActivityIndicatorVisible = visible;
    StatusBarManager.setNetworkActivityIndicatorVisible(visible);
  }

  /**
   * Set the background color for the status bar
   * @param color Background color.
   * @param animated Animate the style change.
   */
  static setBackgroundColor(color: string, animated?: boolean) {
    if (Platform.OS !== 'android') {
      console.warn('`setBackgroundColor` is only available on Android');
      return;
    }
    animated = animated || false;
    StatusBar._defaultProps.backgroundColor.value = color;
    StatusBarManager.setColor(processColor(color), animated);
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
    StatusBarManager.setTranslucent(translucent);
  }

  static propTypes = {
    /**
     * If the status bar is hidden.
     */
    hidden: PropTypes.bool,
    /**
     * If the transition between status bar property changes should be animated.
     * Supported for backgroundColor, barStyle and hidden.
     */
    animated: PropTypes.bool,
    /**
     * The background color of the status bar.
     * @platform android
     */
    backgroundColor: ColorPropType,
    /**
     * If the status bar is translucent.
     * When translucent is set to true, the app will draw under the status bar.
     * This is useful when using a semi transparent status bar color.
     *
     * @platform android
     */
    translucent: PropTypes.bool,
    /**
     * Sets the color of the status bar text.
     */
    barStyle: PropTypes.oneOf(['default', 'light-content', 'dark-content']),
    /**
     * If the network activity indicator should be visible.
     *
     * @platform ios
     */
    networkActivityIndicatorVisible: PropTypes.bool,
    /**
     * The transition effect when showing and hiding the status bar using the `hidden`
     * prop. Defaults to 'fade'.
     *
     * @platform ios
     */
    showHideTransition: PropTypes.oneOf(['fade', 'slide']),
  };

  static defaultProps = {
    animated: false,
    showHideTransition: 'fade',
  };

  _stackEntry = null;

  componentDidMount() {
    // Every time a StatusBar component is mounted, we push it's prop to a stack
    // and always update the native status bar with the props from the top of then
    // stack. This allows having multiple StatusBar components and the one that is
    // added last or is deeper in the view hierachy will have priority.
    this._stackEntry = createStackEntry(this.props);
    StatusBar._propsStack.push(this._stackEntry);
    this._updatePropsStack();
  }

  componentWillUnmount() {
    // When a StatusBar is unmounted, remove itself from the stack and update
    // the native bar with the next props.
    // $FlowFixMe found when converting React.createClass to ES6
    const index = StatusBar._propsStack.indexOf(this._stackEntry);
    StatusBar._propsStack.splice(index, 1);

    this._updatePropsStack();
  }

  componentDidUpdate() {
    // $FlowFixMe found when converting React.createClass to ES6
    const index = StatusBar._propsStack.indexOf(this._stackEntry);
    this._stackEntry = createStackEntry(this.props);
    StatusBar._propsStack[index] = this._stackEntry;

    this._updatePropsStack();
  }

  /**
   * Updates the native status bar with the props from the stack.
   */
  _updatePropsStack = () => {
    // Send the update to the native module only once at the end of the frame.
    clearImmediate(StatusBar._updateImmediate);
    StatusBar._updateImmediate = setImmediate(() => {
      const oldProps = StatusBar._currentValues;
      const mergedProps = mergePropsStack(
        StatusBar._propsStack,
        StatusBar._defaultProps
      );

      // Update the props that have changed using the merged values from the props stack.
      if (Platform.OS === 'ios') {
        if (
          !oldProps ||
          oldProps.barStyle.value !== mergedProps.barStyle.value
        ) {
          StatusBarManager.setStyle(
            mergedProps.barStyle.value,
            mergedProps.barStyle.animated
          );
        }
        if (!oldProps || oldProps.hidden.value !== mergedProps.hidden.value) {
          StatusBarManager.setHidden(
            mergedProps.hidden.value,
            mergedProps.hidden.animated ? mergedProps.hidden.transition : 'none'
          );
        }

        if (
          !oldProps ||
          oldProps.networkActivityIndicatorVisible !==
            mergedProps.networkActivityIndicatorVisible
        ) {
          StatusBarManager.setNetworkActivityIndicatorVisible(
            mergedProps.networkActivityIndicatorVisible
          );
        }
      } else if (Platform.OS === 'android') {
        if (
          !oldProps ||
          oldProps.barStyle.value !== mergedProps.barStyle.value
        ) {
          StatusBarManager.setStyle(mergedProps.barStyle.value);
        }
        if (
          !oldProps ||
          oldProps.backgroundColor.value !== mergedProps.backgroundColor.value
        ) {
          StatusBarManager.setColor(
            processColor(mergedProps.backgroundColor.value),
            mergedProps.backgroundColor.animated
          );
        }
        if (!oldProps || oldProps.hidden.value !== mergedProps.hidden.value) {
          StatusBarManager.setHidden(mergedProps.hidden.value);
        }
        if (!oldProps || oldProps.translucent !== mergedProps.translucent) {
          StatusBarManager.setTranslucent(mergedProps.translucent);
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
