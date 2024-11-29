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

import Text from '../../Text/Text';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

export default (createAnimatedComponent(
  (Text: $FlowFixMe),
): AnimatedComponentType<
  React.ElementConfig<typeof Text>,
  React.ElementRef<typeof Text>,
>);
