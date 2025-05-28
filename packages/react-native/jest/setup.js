/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// NOTE: Ideally, these would use `$Exports`, but Flow is struggling to resolve
// these module specifiers. Also, these are prefixed with `mock_` to workaround
// Jest's `babel-plugin-jest-hoist` plugin which validates that mock factories
// only reference local variables. (It is unaware of generic type annotations.)
import typeof * as mock_TScrollView from '../Libraries/Components/ScrollView/ScrollView';
import type {ViewProps as mock_ViewProps} from '../Libraries/Components/View/ViewPropTypes';
import typeof * as mock_TModal from '../Libraries/Modal/Modal';
import typeof * as mock_TMockComponent from './mockComponent';
import typeof * as mock_TMockModal from './mockModal';
import typeof * as mock_TMockNativeComponent from './mockNativeComponent';
import typeof * as mock_TMockNativeMethods from './MockNativeMethods';
import typeof * as mock_TMockScrollView from './mockScrollView';
import typeof * as mock_TRefreshControlMock from './RefreshControlMock';

global.IS_REACT_ACT_ENVIRONMENT = true;
// Suppress the `react-test-renderer` warnings until New Architecture and legacy
// mode are no longer supported by React Native.
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

jest.requireActual<mixed>('@react-native/js-polyfills/error-guard');

/**
 * @see https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options
 */
function mockESModule<T>(exports: T): {__esModule: true, ...T} {
  return {__esModule: true, ...exports};
}

// $FlowIgnore[cannot-write]
Object.defineProperties(global, {
  __DEV__: {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true,
  },
  cancelAnimationFrame: {
    configurable: true,
    enumerable: true,
    value(id: TimeoutID): void {
      return clearTimeout(id);
    },
    writable: true,
  },
  nativeFabricUIManager: {
    configurable: true,
    enumerable: true,
    value: {},
    writable: true,
  },
  performance: {
    configurable: true,
    enumerable: true,
    value: {
      // $FlowIgnore[method-unbinding]
      now: jest.fn(Date.now),
    },
    writable: true,
  },
  regeneratorRuntime: {
    configurable: true,
    enumerable: true,
    value: jest.requireActual<mixed>('regenerator-runtime/runtime'),
    writable: true,
  },
  requestAnimationFrame: {
    configurable: true,
    enumerable: true,
    value(callback: number => void): TimeoutID {
      return setTimeout(() => callback(jest.now()), 0);
    },
    writable: true,
  },
  window: {
    configurable: true,
    enumerable: true,
    value: global,
    writable: true,
  },
});

jest
  .mock('../Libraries/Core/InitializeCore', () => {})
  .mock('../Libraries/Core/NativeExceptionsManager')
  .mock('../Libraries/ReactNative/UIManager', () =>
    mockESModule({
      default: {
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
        hasViewManagerConfig: jest.fn(name => {
          return name === 'AndroidDrawerLayout';
        }),
        measure: jest.fn(),
        manageChildren: jest.fn(),
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
      },
    }),
  )
  .mock('../Libraries/Image/Image', () => {
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;
    return mockESModule({
      default: mockComponent(
        '../Libraries/Image/Image',
        /* instanceMethods */ null,
        /* isESModule */ true,
      ),
    });
  })
  .mock('../Libraries/Text/Text', () => {
    const MockNativeMethods = jest.requireActual<mock_TMockNativeMethods>(
      './MockNativeMethods',
    ).default;
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;

    return mockESModule({
      default: mockComponent(
        '../Libraries/Text/Text',
        MockNativeMethods,
        /* isESModule */ true,
      ),
    });
  })
  .mock('../Libraries/Components/TextInput/TextInput', () => {
    const MockNativeMethods = jest.requireActual<mock_TMockNativeMethods>(
      './MockNativeMethods',
    ).default;
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;

    return mockESModule({
      default: mockComponent(
        '../Libraries/Components/TextInput/TextInput',
        /* instanceMethods */ {
          ...MockNativeMethods,
          isFocused: jest.fn(),
          clear: jest.fn(),
          getNativeRef: jest.fn(),
        },
        /* isESModule */ true,
      ),
    });
  })
  .mock('../Libraries/Modal/Modal', () => {
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;
    const mockModal =
      jest.requireActual<mock_TMockModal>('./mockModal').default;

    const baseComponent = mockComponent<mock_TModal>(
      '../Libraries/Modal/Modal',
      /* instanceMethods */ null,
      /* isESModule */ true,
    );

    return mockESModule({
      default: mockModal(baseComponent),
    });
  })
  .mock('../Libraries/Components/View/View', () => {
    const MockNativeMethods = jest.requireActual<mock_TMockNativeMethods>(
      './MockNativeMethods',
    ).default;
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;

    return mockESModule({
      default: mockComponent(
        '../Libraries/Components/View/View',
        /* instanceMethods */ MockNativeMethods,
        /* isESModule */ true,
      ),
    });
  })
  .mock('../Libraries/Components/AccessibilityInfo/AccessibilityInfo', () =>
    mockESModule({
      default: {
        addEventListener: jest.fn(() => ({
          remove: jest.fn(),
        })),
        announceForAccessibility: jest.fn(),
        announceForAccessibilityWithOptions: jest.fn(),
        isAccessibilityServiceEnabled: jest.fn(() => Promise.resolve(false)),
        isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
        isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)),
        isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)),
        isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
        isHighTextContrastEnabled: jest.fn(() => Promise.resolve(false)),
        isDarkerSystemColorsEnabled: jest.fn(() => Promise.resolve(false)),
        prefersCrossFadeTransitions: jest.fn(() => Promise.resolve(false)),
        isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
        isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
        setAccessibilityFocus: jest.fn(),
        sendAccessibilityEvent: jest.fn(),
        getRecommendedTimeoutMillis: jest.fn(() => Promise.resolve(false)),
      },
    }),
  )
  .mock('../Libraries/Components/Clipboard/Clipboard', () =>
    mockESModule({
      default: {
        getString: jest.fn(() => ''),
        setString: jest.fn(),
      },
    }),
  )
  .mock('../Libraries/Components/RefreshControl/RefreshControl', () =>
    mockESModule({
      default: jest.requireActual<mock_TRefreshControlMock>(
        './RefreshControlMock',
      ).default,
    }),
  )
  .mock('../Libraries/Components/ScrollView/ScrollView', () => {
    const MockNativeMethods = jest.requireActual<mock_TMockNativeMethods>(
      './MockNativeMethods',
    ).default;
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;
    const mockScrollView =
      jest.requireActual<mock_TMockScrollView>('./mockScrollView').default;

    const baseComponent = mockComponent<mock_TScrollView>(
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
      true, // isESModule
    );

    return mockESModule({
      default: mockScrollView(baseComponent),
    });
  })
  .mock('../Libraries/Components/ActivityIndicator/ActivityIndicator', () => {
    const mockComponent =
      jest.requireActual<mock_TMockComponent>('./mockComponent').default;
    return mockESModule({
      default: mockComponent(
        '../Libraries/Components/ActivityIndicator/ActivityIndicator',
        null, // instanceMethods
        true, // isESModule
      ),
    });
  })
  .mock('../Libraries/AppState/AppState', () =>
    mockESModule({
      default: {
        addEventListener: jest.fn(() => ({
          remove: jest.fn(),
        })),
        removeEventListener: jest.fn(),
        currentState: jest.fn(),
      },
    }),
  )
  .mock('../Libraries/Linking/Linking', () =>
    mockESModule({
      default: {
        openURL: jest.fn(),
        canOpenURL: jest.fn(() => Promise.resolve(true)),
        openSettings: jest.fn(),
        addEventListener: jest.fn(() => ({
          remove: jest.fn(),
        })),
        getInitialURL: jest.fn(() => Promise.resolve()),
        sendIntent: jest.fn(),
      },
    }),
  )
  // Mock modules defined by the native layer (ex: Objective-C, Java)
  .mock('../Libraries/BatchedBridge/NativeModules', () =>
    mockESModule({
      default: {
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
          getSizeWithHeaders: jest.fn((url, headers) =>
            Promise.resolve({height: 222, width: 333}),
          ),
          prefetchImage: jest.fn(),
          prefetchImageWithMetadata: jest.fn(),
          queryCache: jest.fn(),
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
        NativeAnimatedModule: {
          createAnimatedNode: jest.fn(),
          updateAnimatedNodeConfig: jest.fn(),
          getValue: jest.fn(),
          startListeningToAnimatedNodeValue: jest.fn(),
          stopListeningToAnimatedNodeValue: jest.fn(),
          connectAnimatedNodes: jest.fn(),
          disconnectAnimatedNodes: jest.fn(),
          startAnimatingNode: jest.fn(
            (animationId, nodeTag, config, endCallback) => {
              setTimeout(() => endCallback({finished: true}), 16);
            },
          ),
          stopAnimation: jest.fn(),
          setAnimatedNodeValue: jest.fn(),
          setAnimatedNodeOffset: jest.fn(),
          flattenAnimatedNodeOffset: jest.fn(),
          extractAnimatedNodeOffset: jest.fn(),
          connectAnimatedNodeToView: jest.fn(),
          disconnectAnimatedNodeFromView: jest.fn(),
          restoreDefaultValues: jest.fn(),
          dropAnimatedNode: jest.fn(),
          addAnimatedEventToView: jest.fn(),
          removeAnimatedEventFromView: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
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
                prerelease: undefined,
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
          getConstants: () => ({
            BLOB_URI_SCHEME: 'content',
            BLOB_URI_HOST: null,
          }),
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
      },
    }),
  )
  .mock('../Libraries/NativeComponent/NativeComponentRegistry', () => {
    return {
      get: jest.fn((name, viewConfigProvider) => {
        const mockNativeComponent =
          jest.requireActual<mock_TMockNativeComponent>(
            './mockNativeComponent',
          ).default;
        return mockNativeComponent(name);
      }),
      getWithFallback_DEPRECATED: jest.fn((name, viewConfigProvider) => {
        const mockNativeComponent =
          jest.requireActual<mock_TMockNativeComponent>(
            './mockNativeComponent',
          ).default;
        return mockNativeComponent(name);
      }),
      setRuntimeConfigProvider: jest.fn(),
    };
  })
  .mock('../Libraries/ReactNative/requireNativeComponent', () => {
    const mockNativeComponent = jest.requireActual<mock_TMockNativeComponent>(
      './mockNativeComponent',
    ).default;
    return mockESModule({
      default: mockNativeComponent,
    });
  })
  .mock('../Libraries/Vibration/Vibration', () =>
    mockESModule({
      default: {
        vibrate: jest.fn(),
        cancel: jest.fn(),
      },
    }),
  )
  .mock('../Libraries/Components/View/ViewNativeComponent', () => {
    const React = require('react');
    const {createElement} = React;

    const Component = class extends React.Component<mock_ViewProps> {
      render(): React.Node {
        // $FlowIgnore[not-a-function]
        return createElement('View', this.props, this.props.children);
      }
    };

    Component.displayName = 'View';

    return mockESModule({
      default: Component,
    });
  })
  // In tests, we can use the default version instead of the one using
  // dependency injection.
  .mock('../Libraries/ReactNative/RendererProxy', () => {
    return jest.requireActual(
      '../Libraries/ReactNative/RendererImplementation',
    );
  })
  .mock('../Libraries/Utilities/useColorScheme', () =>
    mockESModule({
      default: jest.fn().mockReturnValue('light'),
    }),
  );
