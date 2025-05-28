/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedProps} from '../createAnimatedComponent';

import SectionList, {type SectionListProps} from '../../Lists/SectionList';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

// $FlowFixMe
export default (createAnimatedComponent(SectionList): component<
  // $FlowExpectedError[unclear-type]
  ItemT = any,
  // $FlowExpectedError[unclear-type]
  SectionT = any,
>(
  ref?: React.RefSetter<SectionList<ItemT, SectionT>>,
  ...props: AnimatedProps<SectionListProps<ItemT, SectionT>>
));
