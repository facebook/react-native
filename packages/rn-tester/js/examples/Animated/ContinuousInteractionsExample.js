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

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {Text} from 'react-native';

function AnimatedContinuousInteractionsExample(): React.Node {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <Text style={{color: theme.SecondaryLabelColor}}>
      Checkout the Gratuitous Animation App!
    </Text>
  );
}

export default ({
  title: 'Continuous Interactions',
  name: 'continuousInteractions',
  description: ('Gesture events, chaining, 2D ' +
    'values, interrupting and transitioning ' +
    'animations, etc.': string),
  render(): React.Element<typeof AnimatedContinuousInteractionsExample> {
    return <AnimatedContinuousInteractionsExample />;
  },
}: RNTesterModuleExample);
