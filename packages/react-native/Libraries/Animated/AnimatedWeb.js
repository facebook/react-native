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

import type {AnimatedComponentType} from './createAnimatedComponent';

import AnimatedImplementation from './AnimatedImplementation';
import React from 'react';

export default {
  ...AnimatedImplementation,
  div: AnimatedImplementation.createAnimatedComponent<
    React.PropsOf<'div'>,
    mixed,
  >(
    /* $FlowFixMe[incompatible-call] createAnimatedComponent expects to receive
     * types. Plain intrinsic components can't be typed like this */
    'div',
  ) as AnimatedComponentType<React.PropsOf<'div'>>,
  span: AnimatedImplementation.createAnimatedComponent<
    React.PropsOf<'span'>,
    mixed,
  >(
    /* $FlowFixMe[incompatible-call] createAnimatedComponent expects to receive
     * types. Plain intrinsic components can't be typed like this */
    'span',
  ) as AnimatedComponentType<React.PropsOf<'span'>>,
  img: AnimatedImplementation.createAnimatedComponent<
    React.PropsOf<'img'>,
    mixed,
  >(
    /* $FlowFixMe[incompatible-call] createAnimatedComponent expects to receive
     * types. Plain intrinsic components can't be typed like this */
    'img',
  ) as AnimatedComponentType<React.PropsOf<'img'>>,
};
