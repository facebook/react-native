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

/**
 * Set up the BatchedBridge. This must be done after the other steps in
 * InitializeCore to ensure that the JS environment has been initialized.
 * You can use this module directly, or just require InitializeCore.
 */
const BatchedBridge = require('BatchedBridge');
BatchedBridge.registerLazyCallableModule('Systrace', () => require('Systrace'));
BatchedBridge.registerLazyCallableModule('JSTimers', () => require('JSTimers'));
BatchedBridge.registerLazyCallableModule('HeapCapture', () =>
  require('HeapCapture'),
);
BatchedBridge.registerLazyCallableModule('SamplingProfiler', () =>
  require('SamplingProfiler'),
);
BatchedBridge.registerLazyCallableModule('RCTLog', () => require('RCTLog'));
BatchedBridge.registerLazyCallableModule('RCTDeviceEventEmitter', () =>
  require('RCTDeviceEventEmitter'),
);
BatchedBridge.registerLazyCallableModule('RCTNativeAppEventEmitter', () =>
  require('RCTNativeAppEventEmitter'),
);
BatchedBridge.registerLazyCallableModule('PerformanceLogger', () =>
  require('PerformanceLogger'),
);
BatchedBridge.registerLazyCallableModule('JSDevSupportModule', () =>
  require('JSDevSupportModule'),
);

if (__DEV__ && !global.__RCTProfileIsProfiling) {
  BatchedBridge.registerCallableModule('HMRClient', require('HMRClient'));
}
