/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

jest.requireActual('@react-native/js-polyfills/error-guard');

jest
  .mock('react-native/Libraries/ReactNative/UIManager', () => ({
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
    getConstants: () => ({
      ViewManagerNames: [],
    }),
    getDefaultEventTypes: jest.fn(),
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

      return {NativeProps: {}};
    }),
    hasViewManagerConfig: jest.fn(name => {
      return name === 'AndroidDrawerLayout';
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
  // Mock modules defined by the native layer (ex: Objective-C, Java)
  .mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
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
      getSize: jest.fn(url => Promise.resolve([320, 240])),
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
        return {
          reactNativeVersion: {
            major: 1000,
            minor: 0,
            patch: 0,
          },
        };
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
  }));
