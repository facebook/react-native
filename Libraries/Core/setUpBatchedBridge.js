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
const BatchedBridge = require('../BatchedBridge/BatchedBridge');
BatchedBridge.registerLazyCallableModule('Systrace', () =>
  require('../Performance/Systrace'),
);
BatchedBridge.registerLazyCallableModule('JSTimers', () =>
  require('./Timers/JSTimers'),
);
BatchedBridge.registerLazyCallableModule('HeapCapture', () =>
  require('../Utilities/HeapCapture'),
);
BatchedBridge.registerLazyCallableModule('SamplingProfiler', () =>
  require('../Performance/SamplingProfiler'),
);
BatchedBridge.registerLazyCallableModule('RCTLog', () =>
  require('../Utilities/RCTLog'),
);
BatchedBridge.registerLazyCallableModule('RCTDeviceEventEmitter', () =>
  require('../EventEmitter/RCTDeviceEventEmitter'),
);
BatchedBridge.registerLazyCallableModule('RCTNativeAppEventEmitter', () =>
  require('../EventEmitter/RCTNativeAppEventEmitter'),
);
BatchedBridge.registerLazyCallableModule('GlobalPerformanceLogger', () =>
  require('../Utilities/GlobalPerformanceLogger'),
);
BatchedBridge.registerLazyCallableModule('JSDevSupportModule', () =>
  require('../Utilities/JSDevSupportModule'),
);

if (__DEV__ && !global.__RCTProfileIsProfiling) {
  BatchedBridge.registerCallableModule(
    'HMRClient',
    require('../Utilities/HMRClient'),
  );
}
