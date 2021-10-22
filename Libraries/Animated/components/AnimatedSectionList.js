/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

import SectionList from '../../Lists/SectionList';
const createAnimatedComponent = require('../createAnimatedComponent');

import type {AnimatedComponentType} from '../createAnimatedComponent';

/**
 * @see https://github.com/facebook/react-native/commit/b8c8562
 */
const SectionListWithEventThrottle = React.forwardRef((props, ref) => (
  <SectionList scrollEventThrottle={0.0001} {...props} ref={ref} />
));

module.exports = (createAnimatedComponent(
  SectionListWithEventThrottle,
): AnimatedComponentType<
  React.ElementConfig<typeof SectionList>,
  React.ElementRef<typeof SectionList>,
>);
