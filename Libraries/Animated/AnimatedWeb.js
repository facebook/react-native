/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import AnimatedImplementation from './AnimatedImplementation';

export default {
  ...AnimatedImplementation,
  /* $FlowFixMe[incompatible-call] createAnimatedComponent expects to receive
   * types. Plain intrinsic components can't be typed like this */
  div: (AnimatedImplementation.createAnimatedComponent('div'): $FlowFixMe),
  /* $FlowFixMe[incompatible-call] createAnimatedComponent expects to receive
   * types. Plain intrinsic components can't be typed like this */
  span: (AnimatedImplementation.createAnimatedComponent('span'): $FlowFixMe),
  /* $FlowFixMe[incompatible-call] createAnimatedComponent expects to receive
   * types. Plain intrinsic components can't be typed like this */
  img: (AnimatedImplementation.createAnimatedComponent('img'): $FlowFixMe),
};
