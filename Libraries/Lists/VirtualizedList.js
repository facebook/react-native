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

import {typeof VirtualizedList as VirtualizedListType} from '@react-native/virtualized-lists';

const VirtualizedList: VirtualizedListType =
  require('@react-native/virtualized-lists').VirtualizedList;

export type {
  RenderItemProps,
  RenderItemType,
  Separators,
} from '@react-native/virtualized-lists';
module.exports = VirtualizedList;
