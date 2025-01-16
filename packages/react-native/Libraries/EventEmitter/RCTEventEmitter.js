/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import registerCallableModule from '../Core/registerCallableModule';

const RCTEventEmitter = {
  register(eventEmitter: any) {
    registerCallableModule('RCTEventEmitter', eventEmitter);
  },
};

module.exports = RCTEventEmitter;
