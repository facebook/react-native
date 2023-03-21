/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import {type ColorValue} from '../../StyleSheet/StyleSheet';
import * as React from 'react';

type IndicatorSize = number | 'small' | 'large';

type IOSProps = $ReadOnly<{|
  /**
    Whether the indicator should hide when not animating.

    @platform ios
  */
  hidesWhenStopped?: ?boolean,
|}>;

type Props = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,

  /**
   	Whether to show the indicator (`true`) or hide it (`false`).
   */
  animating?: ?boolean,

  /**
    The foreground color of the spinner.

    @default {@platform android} `null` (system accent default color)
    @default {@platform ios} '#999999'
  */
  color?: ?ColorValue,

  /**
    Size of the indicator.

    @type enum(`'small'`, `'large'`)
    @type {@platform android} number
  */
  size?: ?IndicatorSize,
|}>;

export type ActivityIndicator = React.AbstractComponent<
  Props,
  HostComponent<mixed>,
>;
