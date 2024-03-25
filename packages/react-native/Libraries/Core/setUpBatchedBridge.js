/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import registerCallableModule from './registerCallableModule';

registerCallableModule('Systrace', () => require('../Performance/Systrace'));
if (!(global.RN$Bridgeless === true)) {
  registerCallableModule('JSTimers', () => require('./Timers/JSTimers'));
}
registerCallableModule('HeapCapture', () =>
  require('../HeapCapture/HeapCapture'),
);
registerCallableModule('SamplingProfiler', () =>
  require('../Performance/SamplingProfiler'),
);
registerCallableModule('RCTLog', () => require('../Utilities/RCTLog'));
registerCallableModule(
  'RCTDeviceEventEmitter',
  () => require('../EventEmitter/RCTDeviceEventEmitter').default,
);
registerCallableModule('RCTNativeAppEventEmitter', () =>
  require('../EventEmitter/RCTNativeAppEventEmitter'),
);
registerCallableModule('GlobalPerformanceLogger', () =>
  require('../Utilities/GlobalPerformanceLogger'),
);

if (__DEV__) {
  registerCallableModule('HMRClient', () => require('../Utilities/HMRClient'));
} else {
  registerCallableModule('HMRClient', () =>
    require('../Utilities/HMRClientProdShim'),
  );
}
