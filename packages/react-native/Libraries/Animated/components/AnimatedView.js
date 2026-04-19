/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../Components/View/ViewPropTypes';
import type {AnimatedComponentType} from '../createAnimatedComponent';

import View from '../../Components/View/View';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

// $FlowFixMe[incompatible-type]
export default createAnimatedComponent(View) as AnimatedComponentType<
  ViewProps,
  React.ElementRef<typeof View>,
>;
