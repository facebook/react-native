/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @flow
 * @generated SignedSource<<45ec3626ad048b08dac9b031b02bc0a8>>
 *
 * This file was sync'd from the facebook/react repository.
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
