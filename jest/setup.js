/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const MockNativeMethods = jest.requireActual('./MockNativeMethods');
const mockComponent = jest.requireActual('./mockComponent');

jest.requireActual('@react-native/polyfills/Object.es7');
jest.requireActual('@react-native/polyfills/error-guard');

global.__DEV__ = true;

global.performance = {
  now: jest.fn(Date.now),
};

global.Promise = jest.requireActual('promise');
global.regeneratorRuntime = jest.requireActual('regenerator-runtime/runtime');

global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// there's a __mock__ for it.
jest.setMock(
  '../Libraries/vendor/core/ErrorUtils',
  require('../Libraries/vendor/core/ErrorUtils'),
);

jest
  .mock('../Libraries/Core/InitializeCore', () => {})
  .mock('../Libraries/Core/NativeExceptionsManager', () => ({
    __esModule: true,
    default: {
      reportException: jest.fn(),
    },
  }))
  .mock('../Libraries/ReactNative/UIManager', () => ({
    AndroidViewPager: {
      Commands: {
        setPage: jest.fn(),
        setPageWithoutAnimation: jest.fn(),
      },
    },
    blur: jest.fn(),
    createView: jest.fn(),
    customBubblingEventTypes: {},
    customDirectEventTypes: {},
    dispatchViewManagerCommand: jest.fn(),
    focus: jest.fn(),
    getViewManagerConfig: jest.fn(name => {
      if (name === 'AndroidDrawerLayout') {
        return {
          Constants: {
            DrawerPosition: {
              Left: 10,
            },
          },
        };
      }
    }),
    measure: jest.fn(),
    manageChildren: jest.fn(),
    removeSubviewsFromContainerWithID: jest.fn(),
    replaceExistingNonRootView: jest.fn(),
    setChildren: jest.fn(),
    updateView: jest.fn(),
    AndroidDrawerLayout: {
      Constants: {
        DrawerPosition: {
          Left: 10,
        },
      },
    },
    AndroidTextInput: {
      Commands: {},
    },
    ScrollView: {
      Constants: {},
    },
    View: {
      Constants: {},
    },
  }))
  .mock('../Libraries/Image/Image', () =>
    mockComponent('../Libraries/Image/Image'),
  )
  .mock('../Libraries/Text/Text', () =>
    mockComponent('../Libraries/Text/Text', MockNativeMethods),
  )
  .mock('../Libraries/Components/TextInput/TextInput', () =>
    mockComponent('../Libraries/Components/TextInput/TextInput', {
      ...MockNativeMethods,
      isFocused: jest.fn(),
      clear: jest.fn(),
      getNativeRef: jest.fn(),
    }),
  )
  .mock('../Libraries/Modal/Modal', () =>
    mockComponent('../Libraries/Modal/Modal'),
  )
  .mock('../Libraries/Components/View/View', () =>
    mockComponent('../Libraries/Components/View/View', MockNativeMethods),
  )
  .mock('../Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
    addEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
    fetch: jest.fn(),
    isBoldTextEnabled: jest.fn(),
    isGrayscaleEnabled: jest.fn(),
    isInvertColorsEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    isReduceTransparencyEnabled: jest.fn(),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    removeEventListener: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  }))
  .mock('../Libraries/Components/RefreshControl/RefreshControl', () =>
    jest.requireActual(
      '../Libraries/Components/RefreshControl/__mocks__/RefreshControlMock',
    ),
  )
  .mock('../Libraries/Components/ScrollView/ScrollView', () => {
    const baseComponent = mockComponent(
      '../Libraries/Components/ScrollView/ScrollView',
      {
        ...MockNativeMethods,
        getScrollResponder: jest.fn(),
        getScrollableNode: jest.fn(),
        getInnerViewNode: jest.fn(),
        getInnerViewRef: jest.fn(),
        getNativeScrollRef: jest.fn(),
        scrollTo: jest.fn(),
        scrollToEnd: jest.fn(),
        flashScrollIndicators: jest.fn(),
        scrollResponderZoomTo: jest.fn(),
        scrollResponderScrollNativeHandleToKeyboard: jest.fn(),
      },
    );
    const mockScrollView = jest.requireActual('./mockScrollView');
    return mockScrollView(baseComponent);
  })
  .mock('../Libraries/Components/ActivityIndicator/ActivityIndicator', () =>
    mockComponent(
      '../Libraries/Components/ActivityIndicator/ActivityIndicator',
    ),
  )
  .mock('../Libraries/AppState/AppState', () => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }))
  .mock('../Libraries/Linking/Linking', () => ({
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openSettings: jest.fn(),
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(() => Promise.resolve()),
    removeEventListener: jest.fn(),
    sendIntent: jest.fn(),
  }))
  // Mock modules defined by the native layer (ex: Objective-C, Java)
  .mock('../Libraries/BatchedBridge/NativeModules', () => ({
    AlertManager: {
      alertWithArgs: jest.fn(),
    },
    AsyncLocalStorage: {
      multiGet: jest.fn((keys, callback) =>
        process.nextTick(() => callback(null, [])),
      ),
      multiSet: jest.fn((entries, callback) =>
        process.nextTick(() => callback(null)),
      ),
      multiRemove: jest.fn((keys, callback) =>
        process.nextTick(() => callback(null)),
      ),
      multiMerge: jest.fn((entries, callback) =>
        process.nextTick(() => callback(null)),
      ),
      clear: jest.fn(callback => process.nextTick(() => callback(null))),
      getAllKeys: jest.fn(callback =>
        process.nextTick(() => callback(null, [])),
      ),
    },
    Clipboard: {
      getString: jest.fn(() => ''),
      setString: jest.fn(),
    },
    DeviceInfo: {
      getConstants() {
        return {
          Dimensions: {
            window: {
              fontScale: 2,
              height: 1334,
              scale: 2,
              width: 750,
            },
            screen: {
              fontScale: 2,
              height: 1334,
              scale: 2,
              width: 750,
            },
          },
        };
      },
    },
    DevSettings: {
      addMenuItem: jest.fn(),
      reload: jest.fn(),
    },
    ImageLoader: {
      getSize: jest.fn(url => Promise.resolve({width: 320, height: 240})),
      prefetchImage: jest.fn(),
    },
    ImageViewManager: {
      getSize: jest.fn((uri, success) =>
        process.nextTick(() => success(320, 240)),
      ),
      prefetchImage: jest.fn(),
    },
    KeyboardObserver: {
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    Networking: {
      sendRequest: jest.fn(),
      abortRequest: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    PlatformConstants: {
      getConstants() {
        return {};
      },
    },
    PushNotificationManager: {
      presentLocalNotification: jest.fn(),
      scheduleLocalNotification: jest.fn(),
      cancelAllLocalNotifications: jest.fn(),
      removeAllDeliveredNotifications: jest.fn(),
      getDeliveredNotifications: jest.fn(callback =>
        process.nextTick(() => []),
      ),
      removeDeliveredNotifications: jest.fn(),
      setApplicationIconBadgeNumber: jest.fn(),
      getApplicationIconBadgeNumber: jest.fn(callback =>
        process.nextTick(() => callback(0)),
      ),
      cancelLocalNotifications: jest.fn(),
      getScheduledLocalNotifications: jest.fn(callback =>
        process.nextTick(() => callback()),
      ),
      requestPermissions: jest.fn(() =>
        Promise.resolve({alert: true, badge: true, sound: true}),
      ),
      abandonPermissions: jest.fn(),
      checkPermissions: jest.fn(callback =>
        process.nextTick(() =>
          callback({alert: true, badge: true, sound: true}),
        ),
      ),
      getInitialNotification: jest.fn(() => Promise.resolve(null)),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    SourceCode: {
      getConstants() {
        return {
          scriptURL: null,
        };
      },
    },
    StatusBarManager: {
      setColor: jest.fn(),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
      setNetworkActivityIndicatorVisible: jest.fn(),
      setBackgroundColor: jest.fn(),
      setTranslucent: jest.fn(),
      getConstants: () => ({
        HEIGHT: 42,
      }),
    },
    Timing: {
      createTimer: jest.fn(),
      deleteTimer: jest.fn(),
    },
    UIManager: {},
    BlobModule: {
      getConstants: () => ({BLOB_URI_SCHEME: 'content', BLOB_URI_HOST: null}),
      addNetworkingHandler: jest.fn(),
      enableBlobSupport: jest.fn(),
      disableBlobSupport: jest.fn(),
      createFromParts: jest.fn(),
      sendBlob: jest.fn(),
      release: jest.fn(),
    },
    WebSocketModule: {
      connect: jest.fn(),
      send: jest.fn(),
      sendBinary: jest.fn(),
      ping: jest.fn(),
      close: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    I18nManager: {
      allowRTL: jest.fn(),
      forceRTL: jest.fn(),
      swapLeftAndRightInRTL: jest.fn(),
      getConstants: () => ({
        isRTL: false,
        doLeftAndRightSwapInRTL: true,
      }),
    },
  }))
  .mock('../Libraries/ReactNative/requireNativeComponent', () => {
    const React = require('react');

    return viewName => {
      const Component = class extends React.Component {
        render() {
          return React.createElement(viewName, this.props, this.props.children);
        }

        // The methods that exist on host components
        blur = jest.fn();
        focus = jest.fn();
        measure = jest.fn();
        measureInWindow = jest.fn();
        measureLayout = jest.fn();
        setNativeProps = jest.fn();
      };

      if (viewName === 'RCTView') {
        Component.displayName = 'View';
      } else {
        Component.displayName = viewName;
      }

      return Component;
    };
  })
  .mock(
    '../Libraries/Utilities/verifyComponentAttributeEquivalence',
    () => function() {},
  )
  .mock('../Libraries/Components/View/ViewNativeComponent', () => {
    const React = require('react');
    const Component = class extends React.Component {
      render() {
        return React.createElement('View', this.props, this.props.children);
      }
    };

    Component.displayName = 'View';

    return {
      __esModule: true,
      default: Component,
    };
  });
