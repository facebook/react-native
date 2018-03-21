/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFabricInternals
 * @flow
 * @format
 */

'use strict';

const {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} = require('ReactFabric');

import type {NativeMethodsMixinType} from 'ReactNativeTypes';

const {
  NativeMethodsMixin,
  ReactNativeBridgeEventPlugin,
  createReactNativeComponentClass,
} = __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

module.exports = {
  NativeMethodsMixin: ((NativeMethodsMixin: any): $Exact<
    NativeMethodsMixinType,
  >),
  ReactNativeBridgeEventPlugin,
  createReactNativeComponentClass,
};
