/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} = require('ReactFabric');
const createReactNativeComponentClass = require('createReactNativeComponentClass');

import type {NativeMethodsMixinType} from 'ReactNativeTypes';

const {NativeMethodsMixin} = __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

module.exports = {
  NativeMethodsMixin: ((NativeMethodsMixin: any): $Exact<
    NativeMethodsMixinType,
  >),
  createReactNativeComponentClass,
};
