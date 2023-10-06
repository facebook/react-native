/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {SectionBase} from '../../Lists/SectionList';
import type {AnimatedComponentType} from '../createAnimatedComponent';

import SectionList from '../../Lists/SectionList';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

/**
 * @see https://github.com/facebook/react-native/commit/b8c8562
 */
const SectionListWithEventThrottle = React.forwardRef(
  // $FlowFixMe[incompatible-call]
  (
    props: React.ElementConfig<typeof SectionList>,
    ref:
      | ((null | SectionList<SectionBase<$FlowFixMe>>) => mixed)
      | {
          current: null | SectionList<SectionBase<$FlowFixMe>>,
          ...
        },
  ) => <SectionList {...props} ref={ref} />,
);

export default (createAnimatedComponent(
  SectionListWithEventThrottle,
): AnimatedComponentType<
  React.ElementConfig<typeof SectionList>,
  React.ElementRef<typeof SectionList>,
>);
