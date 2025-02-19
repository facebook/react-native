/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import typeof XMLHttpRequest from './XMLHttpRequest_old';

export type * from './XMLHttpRequest_old';

// Use a global instead of a flag from ReactNativeFeatureFlags because this will
// be read before apps have a chance to set overrides.
const useBuiltInEventTarget = global.RN$useBuiltInEventTarget?.();

export default (useBuiltInEventTarget
  ? // $FlowExpectedError[incompatible-cast]
    require('./XMLHttpRequest_new').default
  : // $FlowExpectedError[incompatible-cast]
    require('./XMLHttpRequest_old').default) as XMLHttpRequest;
