/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @generated SignedSource<<2d98809d55453ea61e203a8425692891>>
 */

'use strict';

import type {ReactNativeType} from './ReactNativeTypes';

let ReactNative;

if (__DEV__) {
  ReactNative = require('../implementations/ReactNativeRenderer-dev');
} else {
  ReactNative = require('../implementations/ReactNativeRenderer-prod');
}

module.exports = (ReactNative: ReactNativeType);
