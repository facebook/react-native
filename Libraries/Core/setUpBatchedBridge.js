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

let registerModule;
if (global.RN$Bridgeless === true && global.RN$registerCallableModule) {
  registerModule = global.RN$registerCallableModule;
} else {
  const BatchedBridge = require('../BatchedBridge/BatchedBridge');
  registerModule = (moduleName, factory) =>
    BatchedBridge.registerLazyCallableModule(moduleName, factory);
}

registerModule('Systrace', () => require('../Performance/Systrace'));
registerModule('JSTimers', () => require('./Timers/JSTimers'));
registerModule('HeapCapture', () => require('../HeapCapture/HeapCapture'));
registerModule('SamplingProfiler', () =>
  require('../Performance/SamplingProfiler'),
);
registerModule('RCTLog', () => require('../Utilities/RCTLog'));
registerModule(
  'RCTDeviceEventEmitter',
  () => require('../EventEmitter/RCTDeviceEventEmitter').default,
);
registerModule('RCTNativeAppEventEmitter', () =>
  require('../EventEmitter/RCTNativeAppEventEmitter'),
);
registerModule('GlobalPerformanceLogger', () =>
  require('../Utilities/GlobalPerformanceLogger'),
);
registerModule('JSDevSupportModule', () =>
  require('../Utilities/JSDevSupportModule'),
);

if (__DEV__ && !global.__RCTProfileIsProfiling) {
  registerModule('HMRClient', () => require('../Utilities/HMRClient'));
} else {
  registerModule('HMRClient', () => require('../Utilities/HMRClientProdShim'));
}
