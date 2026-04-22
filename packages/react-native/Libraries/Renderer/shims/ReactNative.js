/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @nolint
 * @flow
 * @generated SignedSource<<5908e4e900f26a939c59a16d2c252af3>>
 *
 * This file is no longer sync'd from the facebook/react repository.
 * The version compatibility check is removed. Use at your own risk.
 */
'use strict';

// The underlying type no longer exists
let ReactNative: $FlowFixMe;

if (__DEV__) {
  ReactNative = require('../implementations/ReactNativeRenderer-dev');
} else {
  ReactNative = require('../implementations/ReactNativeRenderer-prod');
}

export default ReactNative;
