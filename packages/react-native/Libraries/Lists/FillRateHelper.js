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

import {typeof FillRateHelper as FillRateHelperType} from '@react-native-macos/virtualized-lists'; // [macOS]

const FillRateHelper: FillRateHelperType =
  require('@react-native-macos/virtualized-lists').FillRateHelper; // [macOS]

export type {FillRateInfo} from '@react-native-macos/virtualized-lists'; // [macOS]
module.exports = FillRateHelper;
