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

import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';
import {View} from 'react-native';

export default (createAnimatedComponent(View): AnimatedComponentType<
  React.ElementConfig<typeof View>,
  React.ElementRef<typeof View>,
>);
