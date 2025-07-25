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

import {typeof VirtualizedList as VirtualizedListType} from '@react-native-macos/virtualized-lists'; // [macOS]

const VirtualizedList: VirtualizedListType =
  require('@react-native-macos/virtualized-lists').VirtualizedList; // [macOS]

export type {
  RenderItemProps,
  RenderItemType,
  Separators,
} from '@react-native-macos/virtualized-lists'; // [macOS]
module.exports = VirtualizedList;
