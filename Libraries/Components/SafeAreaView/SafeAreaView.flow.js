/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../View/ViewPropTypes';

import View from '../View/View';
import * as React from 'react';

export type SafeAreaViewType = React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof View>,
>;
