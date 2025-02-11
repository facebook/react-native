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

import VirtualizedLists from '@react-native/virtualized-lists';

type VirtualizedListType = typeof VirtualizedLists.VirtualizedList;
const VirtualizedList: VirtualizedListType = VirtualizedLists.VirtualizedList;

export type {
  ListRenderItemInfo,
  ListRenderItem,
  Separators,
} from '@react-native/virtualized-lists';
export default VirtualizedList;
