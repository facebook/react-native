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

jest.requireActual('../Libraries/polyfills/Object.es7.js');
jest.requireActual('../Libraries/polyfills/error-guard');

global.__DEV__ = true;

global.Promise = jest.requireActual('promise');
global.regeneratorRuntime = jest.requireActual('regenerator-runtime/runtime');

global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

jest.mock('../Libraries/Core/Devtools/setupDevtools');

// there's a __mock__ for it.
jest.setMock(
  '../Libraries/vendor/core/ErrorUtils',
  require('../Libraries/vendor/core/ErrorUtils'),
);

jest
  .mock('../Libraries/Core/InitializeCore', () => {})
  .mock('../Libraries/Image/Image', () =>
    mockComponent('../Libraries/Image/Image'),
  )
  .mock('../Libraries/Text/Text', () =>
    mockComponent('../Libraries/Text/Text', MockNativeMethods),
  )
  .mock('../Libraries/Components/TextInput/TextInput', () =>
    mockComponent('../Libraries/Components/TextInput/TextInput'),
  )
  .mock('../Libraries/Modal/Modal', () =>
    mockComponent('../Libraries/Modal/Modal'),
  )
  .mock('../Libraries/Components/View/View', () =>
    mockComponent('../Libraries/Components/View/View', MockNativeMethods),
  )
  .mock('../Libraries/Components/RefreshControl/RefreshControl', () =>
    jest.requireActual(
      '../Libraries/Components/RefreshControl/__mocks__/RefreshControlMock',
    ),
  )
  .mock('../Libraries/Components/ScrollView/ScrollView', () =>
    jest.requireActual(
      '../Libraries/Components/ScrollView/__mocks__/ScrollViewMock',
    ),
  )
  .mock('../Libraries/Components/ActivityIndicator/ActivityIndicator', () =>
    mockComponent(
      '../Libraries/Components/ActivityIndicator/ActivityIndicator',
    ),
  )
  .mock('../Libraries/Animated/src/AnimatedImplementation', () => {
    const AnimatedImplementation = jest.requireActual(
      '../Libraries/Animated/src/AnimatedImplementation',
    );
    const oldCreate = AnimatedImplementation.createAnimatedComponent;
    AnimatedImplementation.createAnimatedComponent = function(
      Component,
      defaultProps,
    ) {
      const Wrapped = oldCreate(Component, defaultProps);
      Wrapped.__skipSetNativeProps_FOR_TESTS_ONLY = true;
      return Wrapped;
    };
    return AnimatedImplementation;
  })
  .mock('../Libraries/Renderer/shims/ReactNative', () => {
    const ReactNative = jest.requireActual(
      '../Libraries/Renderer/shims/ReactNative',
    );
    const NativeMethodsMixin =
      ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .NativeMethodsMixin;

    Object.assign(NativeMethodsMixin, MockNativeMethods);
    Object.assign(ReactNative.NativeComponent.prototype, MockNativeMethods);

    return ReactNative;
  })
  .mock('../Libraries/Components/Touchable/ensureComponentIsNative', () => () =>
    true,
  );

const mockNativeModules = {
  AccessibilityInfo: {
    addEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
    fetch: jest.fn(),
    isBoldTextEnabled: jest.fn(),
    isGrayscaleEnabled: jest.fn(),
    isInvertColorsEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    isReduceTransparencyEnabled: jest.fn(),
    isScreenReaderEnabled: jest.fn(),
    removeEventListener: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
  AlertManager: {
    alertWithArgs: jest.fn(),
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
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
    getAllKeys: jest.fn(callback => process.nextTick(() => callback(null, []))),
  },
  BuildInfo: {
    appVersion: '0',
    buildVersion: '0',
    getConstants() {
      return {
        appVersion: '0',
        buildVersion: '0',
      };
    },
  },
  Clipboard: {
    setString: jest.fn(),
  },
  DataManager: {
    queryData: jest.fn(),
  },
  DeviceInfo: {
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
  },
  FacebookSDK: {
    login: jest.fn(),
    logout: jest.fn(),
    queryGraphPath: jest.fn((path, method, params, callback) => callback()),
  },
  GraphPhotoUpload: {
    upload: jest.fn(),
  },
  I18n: {
    translationsDictionary: JSON.stringify({
      'Good bye, {name}!|Bye message': '\u{00A1}Adi\u{00F3}s {name}!',
    }),
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
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openSettings: jest.fn(),
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(() => Promise.resolve()),
    removeEventListener: jest.fn(),
    sendIntent: jest.fn(),
  },
  LocationObserver: {
    addListener: jest.fn(),
    getCurrentPosition: jest.fn(),
    removeListeners: jest.fn(),
    requestAuthorization: jest.fn(),
    setConfiguration: jest.fn(),
    startObserving: jest.fn(),
    stopObserving: jest.fn(),
  },
  ModalFullscreenViewManager: {},
  NetInfo: {
    fetch: jest.fn(() => Promise.resolve()),
    getConnectionInfo: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    isConnected: {
      fetch: jest.fn(() => Promise.resolve()),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    isConnectionExpensive: jest.fn(() => Promise.resolve()),
  },
  Networking: {
    sendRequest: jest.fn(),
    abortRequest: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  PushNotificationManager: {
    presentLocalNotification: jest.fn(),
    scheduleLocalNotification: jest.fn(),
    cancelAllLocalNotifications: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
    getDeliveredNotifications: jest.fn(callback => process.nextTick(() => [])),
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
      process.nextTick(() => callback({alert: true, badge: true, sound: true})),
    ),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  SourceCode: {
    scriptURL: null,
  },
  StatusBarManager: {
    HEIGHT: 42,
    setColor: jest.fn(),
    setStyle: jest.fn(),
    setHidden: jest.fn(),
    setNetworkActivityIndicatorVisible: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
  },
  Timing: {
    createTimer: jest.fn(),
    deleteTimer: jest.fn(),
  },
  UIManager: {
    AndroidViewPager: {
      Commands: {
        setPage: jest.fn(),
        setPageWithoutAnimation: jest.fn(),
      },
    },
    blur: jest.fn(),
    createView: jest.fn(),
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
    setChildren: jest.fn(),
    manageChildren: jest.fn(),
    updateView: jest.fn(),
    removeSubviewsFromContainerWithID: jest.fn(),
    replaceExistingNonRootView: jest.fn(),
    customBubblingEventTypes: {},
    customDirectEventTypes: {},
    AndroidTextInput: {
      Commands: {},
    },
    ModalFullscreenView: {
      Constants: {},
    },
    ScrollView: {
      Constants: {},
    },
    View: {
      Constants: {},
    },
  },
  BlobModule: {
    BLOB_URI_SCHEME: 'content',
    BLOB_URI_HOST: null,
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
};

Object.keys(mockNativeModules).forEach(module => {
  try {
    jest.doMock(module, () => mockNativeModules[module]); // needed by FacebookSDK-test
  } catch (e) {
    jest.doMock(module, () => mockNativeModules[module], {virtual: true});
  }
});

jest.doMock(
  '../Libraries/BatchedBridge/NativeModules',
  () => mockNativeModules,
);

jest.doMock('../Libraries/ReactNative/requireNativeComponent', () => {
  const React = require('react');

  return viewName =>
    class extends React.Component {
      render() {
        return React.createElement(viewName, this.props, this.props.children);
      }
    };
});
