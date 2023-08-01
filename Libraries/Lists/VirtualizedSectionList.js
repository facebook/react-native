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

import {typeof VirtualizedSectionList as VirtualizedSectionListType} from '@react-native-mac/virtualized-lists'; // [macOS]

const VirtualizedSectionList: VirtualizedSectionListType =
  require('@react-native-mac/virtualized-lists').VirtualizedSectionList; // [macOS]

export type {
  SectionBase,
  ScrollToLocationParamsType,
} from '@react-native-mac/virtualized-lists'; // [macOS]
module.exports = VirtualizedSectionList;
