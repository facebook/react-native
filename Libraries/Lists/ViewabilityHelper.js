/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

export type {
  ViewToken,
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
} from '@react-native-mac/virtualized-lists'; // [macOS]

import {typeof ViewabilityHelper as ViewabilityHelperType} from '@react-native-mac/virtualized-lists'; // [macOS]

const ViewabilityHelper: ViewabilityHelperType =
  require('@react-native-mac/virtualized-lists').ViewabilityHelper; // [macOS]

module.exports = ViewabilityHelper;
