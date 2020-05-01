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
 * We don't set up the batched bridge in bridgeless mode. Once we've migrated
 * everything over to bridgeless we can just delete this file.
 */
if (!global.RN$Bridgeless) {
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
    require('../HeapCapture/HeapCapture'),
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
    BatchedBridge.registerLazyCallableModule('HMRClient', () =>
      require('../Utilities/HMRClient'),
    );
  } else {
    BatchedBridge.registerLazyCallableModule('HMRClient', () =>
      require('../Utilities/HMRClientProdShim'),
    );
  }
}
