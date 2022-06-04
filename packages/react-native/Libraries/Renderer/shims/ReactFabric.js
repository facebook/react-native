/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @flow
 * @generated SignedSource<<ca65d187831e77f0f589dfd9fa8775bc>>
 *
 * This file was sync'd from the facebook/react repository.
 */

'use strict';

import {BatchedBridge} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import type {ReactFabricType} from './ReactNativeTypes';

let ReactFabric;

if (__DEV__) {
  ReactFabric = require('../implementations/ReactFabric-dev');
} else {
  ReactFabric = require('../implementations/ReactFabric-prod');
}

if (global.RN$Bridgeless) {
  global.RN$stopSurface = ReactFabric.stopSurface;
} else {
  BatchedBridge.registerCallableModule('ReactFabric', ReactFabric);
}

module.exports = (ReactFabric: ReactFabricType);
