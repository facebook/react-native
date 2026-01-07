/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @nolint
 * @flow
 * @generated SignedSource<<7a063365bcf9d96b1cd8714d309e5b92>>
 *
 * This file is no longer sync'd from the facebook/react repository.
 * The version compatibility check is removed. Use at your own risk.
 */
'use strict';

import type {ReactNativeType} from './ReactNativeTypes';

let ReactNative: ReactNativeType;

if (__DEV__) {
  ReactNative = require('../implementations/ReactNativeRenderer-dev');
} else {
  ReactNative = require('../implementations/ReactNativeRenderer-prod');
}

export default ReactNative;
