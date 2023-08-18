/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import * as React from 'react';
import {Text} from 'react-native';

export default ({
  title: 'Continuous Interactions',
  name: 'continuousInteractions',
  description: ('Gesture events, chaining, 2D ' +
    'values, interrupting and transitioning ' +
    'animations, etc.': string),
  render: (): React.Node => <Text>Checkout the Gratuitous Animation App!</Text>,
}: RNTesterModuleExample);
