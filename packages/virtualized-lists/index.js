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

import typeof FillRateHelper from './Lists/FillRateHelper';
import typeof ViewabilityHelper from './Lists/ViewabilityHelper';
import typeof VirtualizedList from './Lists/VirtualizedList';
import type {AnyVirtualizedSectionList} from './Lists/VirtualizedSectionList';

import {typeof VirtualizedListContextResetter} from './Lists/VirtualizedListContext';
import {keyExtractor} from './Lists/VirtualizeUtils';

export type {
  ViewToken,
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
  ViewabilityConfigCallbackPairs,
} from './Lists/ViewabilityHelper';
export type {
  CellRendererProps,
  ListRenderItemInfo,
  ListRenderItem,
  Separators,
  VirtualizedListProps,
} from './Lists/VirtualizedListProps';
export type {
  VirtualizedSectionListProps,
  ScrollToLocationParamsType,
  SectionBase,
  SectionData,
} from './Lists/VirtualizedSectionList';
export type {FillRateInfo} from './Lists/FillRateHelper';

export default {
  keyExtractor,

  get VirtualizedList(): VirtualizedList {
    return require('./Lists/VirtualizedList').default;
  },
  get VirtualizedSectionList(): AnyVirtualizedSectionList {
    return require('./Lists/VirtualizedSectionList').default;
  },
  get VirtualizedListContextResetter(): VirtualizedListContextResetter {
    const VirtualizedListContext = require('./Lists/VirtualizedListContext');
    return VirtualizedListContext.VirtualizedListContextResetter;
  },
  get ViewabilityHelper(): ViewabilityHelper {
    return require('./Lists/ViewabilityHelper').default;
  },
  get FillRateHelper(): FillRateHelper {
    return require('./Lists/FillRateHelper').default;
  },
};
