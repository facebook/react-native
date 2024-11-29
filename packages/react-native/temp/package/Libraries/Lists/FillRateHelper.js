/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {typeof FillRateHelper as FillRateHelperType} from '@react-native/virtualized-lists';

const FillRateHelper: FillRateHelperType =
  require('@react-native/virtualized-lists').FillRateHelper;

export type {FillRateInfo} from '@react-native/virtualized-lists';
module.exports = FillRateHelper;
