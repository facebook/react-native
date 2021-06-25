/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @generated SignedSource<<dd0939e57b6f6addeff0b75ba29fbb41>>
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
