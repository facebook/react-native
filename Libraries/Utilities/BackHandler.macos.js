/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * On Apple TV, this implements back navigation using the TV remote's menu button.
 * On iOS, this just implements a stub.
 *
 * @flow
 * @format
 */

// [macOS]

/* $FlowFixMe allow macOS to share iOS file */
const BackHandler = require('./BackHandler.ios');
module.exports = BackHandler;
