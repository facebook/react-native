/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

global.IS_REACT_ACT_ENVIRONMENT = true;
// Suppress the `react-test-renderer` warnings until New Architecture and legacy
// mode are no longer supported by React Native.
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

import '@react-native/js-polyfills/error-guard';

import mock from './mock';

// $FlowFixMe[cannot-write]
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
      // $FlowFixMe[method-unbinding]
      now: jest.fn(Date.now),
    },
    writable: true,
  },
  regeneratorRuntime: {
    configurable: true,
    enumerable: true,
    value: jest.requireActual<unknown>('regenerator-runtime/runtime'),
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

// This setup script will be published in the react-native package.
// Other people might not have prettier installed, so it will crash the mock below.
// Therefore, we wrap this mock in a try-catch.
try {
  /**
   * Prettier v3 uses import (cjs/mjs) file formats that jest-runtime does not
   * support. To work around this we need to bypass the jest module system by
   * using the orginal node `require` function.
   */
  jest.mock('prettier', () => {
    // $FlowExpectedError[underconstrained-implicit-instantiation]
    const module = jest.requireActual('module');
    return module.prototype.require(require.resolve('prettier'));
  });
} catch {}

// $FlowFixMe[incompatible-type] - `./mocks/AppState` is incomplete.
mock('m#react-native/Libraries/AppState/AppState', 'm#./mocks/AppState');
mock(
  'm#react-native/Libraries/BatchedBridge/NativeModules',
  'm#./mocks/NativeModules',
);
mock(
  'm#react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo',
  'm#./mocks/AccessibilityInfo',
);
mock(
  'm#react-native/Libraries/Components/ActivityIndicator/ActivityIndicator',
  'm#./mocks/ActivityIndicator',
);
mock(
  'm#react-native/Libraries/Components/Clipboard/Clipboard',
  'm#./mocks/Clipboard',
);
mock(
  'm#react-native/Libraries/Components/RefreshControl/RefreshControl',
  // $FlowFixMe[incompatible-type] - `react-native/Libraries/Components/RefreshControl/RefreshControl` should export a component type.
  'm#./mocks/RefreshControl',
);
// $FlowFixMe[incompatible-exact] - `react-native/Libraries/Components/ScrollView/ScrollView` is... I don't even.
// $FlowFixMe[incompatible-type]
mock(
  'm#react-native/Libraries/Components/ScrollView/ScrollView',
  'm#./mocks/ScrollView',
);
mock(
  'm#react-native/Libraries/Components/TextInput/TextInput',
  'm#./mocks/TextInput',
);
mock('m#react-native/Libraries/Components/View/View', 'm#./mocks/View');
mock(
  'm#react-native/Libraries/Components/View/ViewNativeComponent',
  // $FlowFixMe[incompatible-type] - `./mocks/ViewNativeComponent` is incomplete.
  // $FlowFixMe[prop-missing]
  'm#./mocks/ViewNativeComponent',
);
mock(
  'm#react-native/Libraries/Core/InitializeCore',
  'm#./mocks/InitializeCore',
);
mock('m#react-native/Libraries/Core/NativeExceptionsManager');
mock('m#react-native/Libraries/Image/Image', 'm#./mocks/Image');
// $FlowFixMe[incompatible-type] - `./mocks/Linking` is incomplete.
mock('m#react-native/Libraries/Linking/Linking', 'm#./mocks/Linking');
// $FlowFixMe[incompatible-type] - `react-native/Libraries/Modal/Modal` should export a component type.
mock('m#react-native/Libraries/Modal/Modal', 'm#./mocks/Modal');
mock(
  'm#react-native/Libraries/NativeComponent/NativeComponentRegistry',
  // $FlowFixMe[incompatible-type] - `./mocks/NativeComponentRegistry` should export named functions.
  'm#./mocks/NativeComponentRegistry',
);
// $FlowFixMe[incompatible-type] - `./mocks/RendererProxy` is incomplete.
mock(
  'm#react-native/Libraries/ReactNative/RendererProxy',
  'm#./mocks/RendererProxy',
);
mock(
  'm#react-native/Libraries/ReactNative/requireNativeComponent',
  'm#./mocks/requireNativeComponent',
);
// $FlowFixMe[incompatible-type] - `./mocks/UIManager` is incomplete.
mock('m#react-native/Libraries/ReactNative/UIManager', 'm#./mocks/UIManager');
mock('m#react-native/Libraries/Text/Text', 'm#./mocks/Text');
mock(
  'm#react-native/Libraries/Utilities/useColorScheme',
  'm#./mocks/useColorScheme',
);
// $FlowFixMe[incompatible-type]
mock('m#react-native/Libraries/Vibration/Vibration', 'm#./mocks/Vibration');
