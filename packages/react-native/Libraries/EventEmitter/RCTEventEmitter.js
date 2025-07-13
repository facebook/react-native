/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import registerCallableModule from '../Core/registerCallableModule';

const RCTEventEmitter = {
  register(eventEmitter: any) {
    registerCallableModule('RCTEventEmitter', eventEmitter);
  },
};

export default RCTEventEmitter;
