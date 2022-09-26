/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

import ScrollView from '../../Components/ScrollView/ScrollView';
import createAnimatedComponent from '../createAnimatedComponent';

import type {AnimatedComponentType} from '../createAnimatedComponent';

/**
 * @see https://github.com/facebook/react-native/commit/b8c8562
 */
const ScrollViewWithEventThrottle = React.forwardRef((props, ref) => (
  <ScrollView scrollEventThrottle={0.0001} {...props} ref={ref} />
));

export default (createAnimatedComponent(
  ScrollViewWithEventThrottle,
): AnimatedComponentType<
  React.ElementConfig<typeof ScrollView>,
  React.ElementRef<typeof ScrollView>,
>);
