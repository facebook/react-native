/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const AnimatedImplementation = require('./AnimatedImplementation');

module.exports = {
  ...AnimatedImplementation,
  // $FlowFixMe createAnimatedComponent expects to receive types. Plain intrinsic components can't be typed like this
  div: (AnimatedImplementation.createAnimatedComponent('div'): $FlowFixMe),
  // $FlowFixMe createAnimatedComponent expects to receive types. Plain intrinsic components can't be typed like this
  span: (AnimatedImplementation.createAnimatedComponent('span'): $FlowFixMe),
  // $FlowFixMe createAnimatedComponent expects to receive types. Plain intrinsic components can't be typed like this
  img: (AnimatedImplementation.createAnimatedComponent('img'): $FlowFixMe),
};
