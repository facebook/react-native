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
import type {SectionBase} from 'react-native/Libraries/Lists/SectionList';

import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';
import {SectionList} from 'react-native';

export default (createAnimatedComponent(SectionList): AnimatedComponentType<
  React.ElementConfig<typeof SectionList>,
  // $FlowExpectedError[unclear-type]
  SectionList<any, SectionBase<any>>,
>);
