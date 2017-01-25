/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactReifiedYield
 * @flow
 */

'use strict';

import type { ReactYield } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';

var { createFiberFromElementType } = require('ReactFiber');

export type ReifiedYield = { continuation: Fiber, props: Object };

exports.createReifiedYield = function(yieldNode : ReactYield) : ReifiedYield {
  var fiber = createFiberFromElementType(
    yieldNode.continuation,
    yieldNode.key
  );
  /* $FlowFixMe(>=0.38.0 site=react_native_fb,react_native_oss) - Flow error
   * detected during the deployment of v0.38.0. To see the error, remove this
   * comment and run flow
   */
  return {
    continuation: fiber,
    props: yieldNode.props,
  };
};

exports.createUpdatedReifiedYield = function(previousYield : ReifiedYield, yieldNode : ReactYield) : ReifiedYield {
  return {
    continuation: previousYield.continuation,
    props: yieldNode.props,
  };
};
