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

import FlatList from '../../Lists/FlatList';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

export default (createAnimatedComponent(FlatList): AnimatedComponentType<
  React.ElementConfig<typeof FlatList>,
  React.ElementRef<typeof FlatList>,
>);
