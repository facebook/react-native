/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @flow
 * @nolint
 * @generated SignedSource<<0debd6e5a17dc037cb4661315a886de6>>
 * @generated SignedSource<<228cd610b28ff12c92264be0d9be9374>>
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
