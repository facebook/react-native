/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedComponentType} from '../createAnimatedComponent';

import SectionList from '../../Lists/SectionList';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

/**
 * @see https://github.com/facebook/react-native/commit/b8c8562
 */
const SectionListWithEventThrottle = React.forwardRef((props, ref) => (
  <SectionList scrollEventThrottle={0.0001} {...props} ref={ref} />
));

export default (createAnimatedComponent(
  SectionListWithEventThrottle,
): AnimatedComponentType<
  React.ElementConfig<typeof SectionList>,
  React.ElementRef<typeof SectionList>,
>);
