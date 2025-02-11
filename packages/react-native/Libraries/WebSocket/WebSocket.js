/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import typeof WebSocket from './WebSocket_old';

// Use a global instead of a flag from ReactNativeFeatureFlags because this will
// be read before apps have a chance to set overrides.
const useBuiltInEventTarget = global.RN$useBuiltInEventTarget?.();

export default (useBuiltInEventTarget
  ? // $FlowExpectedError[incompatible-cast]
    require('./WebSocket_new').default
  : require('./WebSocket_old').default) as WebSocket;
