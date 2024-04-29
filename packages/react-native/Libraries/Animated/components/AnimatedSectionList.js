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

export default (createAnimatedComponent(SectionList): AnimatedComponentType<
  React.ElementConfig<typeof SectionList>,
  React.ElementRef<typeof SectionList>,
>);
