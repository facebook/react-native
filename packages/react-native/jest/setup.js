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

// $FlowFixMe[incompatible-type] - `./mocks/AppState` is incomplete.
mock('m#../Libraries/AppState/AppState', 'm#./mocks/AppState');
mock('m#../Libraries/BatchedBridge/NativeModules', 'm#./mocks/NativeModules');
mock(
  'm#../Libraries/Components/AccessibilityInfo/AccessibilityInfo',
  'm#./mocks/AccessibilityInfo',
);
mock(
  'm#../Libraries/Components/ActivityIndicator/ActivityIndicator',
  'm#./mocks/ActivityIndicator',
);
mock('m#../Libraries/Components/Clipboard/Clipboard', 'm#./mocks/Clipboard');
mock(
  'm#../Libraries/Components/RefreshControl/RefreshControl',
  // $FlowFixMe[incompatible-type] - `../Libraries/Components/RefreshControl/RefreshControl` should export a component type.
  'm#./mocks/RefreshControl',
);
// $FlowFixMe[incompatible-exact] - `../Libraries/Components/ScrollView/ScrollView` is... I don't even.
// $FlowFixMe[incompatible-type]
mock('m#../Libraries/Components/ScrollView/ScrollView', 'm#./mocks/ScrollView');
mock('m#../Libraries/Components/TextInput/TextInput', 'm#./mocks/TextInput');
mock('m#../Libraries/Components/View/View', 'm#./mocks/View');
mock(
  'm#../Libraries/Components/View/ViewNativeComponent',
  // $FlowFixMe[incompatible-type] - `./mocks/ViewNativeComponent` is incomplete.
  // $FlowFixMe[prop-missing]
  'm#./mocks/ViewNativeComponent',
);
mock('m#../Libraries/Core/InitializeCore', 'm#./mocks/InitializeCore');
mock('m#../Libraries/Core/NativeExceptionsManager');
mock('m#../Libraries/Image/Image', 'm#./mocks/Image');
// $FlowFixMe[incompatible-type] - `./mocks/Linking` is incomplete.
mock('m#../Libraries/Linking/Linking', 'm#./mocks/Linking');
// $FlowFixMe[incompatible-type] - `../Libraries/Modal/Modal` should export a component type.
mock('m#../Libraries/Modal/Modal', 'm#./mocks/Modal');
mock(
  'm#../Libraries/NativeComponent/NativeComponentRegistry',
  // $FlowFixMe[incompatible-type] - `./mocks/NativeComponentRegistry` should export named functions.
  'm#./mocks/NativeComponentRegistry',
);
// $FlowFixMe[incompatible-type] - `./mocks/RendererProxy` is incomplete.
mock('m#../Libraries/ReactNative/RendererProxy', 'm#./mocks/RendererProxy');
mock(
  'm#../Libraries/ReactNative/requireNativeComponent',
  'm#./mocks/requireNativeComponent',
);
// $FlowFixMe[incompatible-type] - `./mocks/UIManager` is incomplete.
mock('m#../Libraries/ReactNative/UIManager', 'm#./mocks/UIManager');
mock('m#../Libraries/Text/Text', 'm#./mocks/Text');
mock('m#../Libraries/Utilities/useColorScheme', 'm#./mocks/useColorScheme');
// $FlowFixMe[incompatible-type]
mock('m#../Libraries/Vibration/Vibration', 'm#./mocks/Vibration');
