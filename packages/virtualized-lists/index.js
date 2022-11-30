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

import {keyExtractor} from './Lists/VirtualizeUtils';

import typeof VirtualizedList from './Lists/VirtualizedList';
import typeof VirtualizedSectionList from './Lists/VirtualizedSectionList';
import {typeof VirtualizedListContextResetter} from './Lists/VirtualizedListContext';
import typeof ViewabilityHelper from './Lists/ViewabilityHelper';

import type {
  ViewToken,
  ViewabilityConfigCallbackPair,
} from './Lists/ViewabilityHelper';
import type {
  RenderItemProps,
  RenderItemType,
  Separators,
} from './Lists/VirtualizedListProps';
import type {
  Props as VirtualizedSectionListProps,
  ScrollToLocationParamsType,
  SectionBase,
} from './Lists/VirtualizedSectionList';

export type {
  RenderItemProps,
  RenderItemType,
  ScrollToLocationParamsType,
  SectionBase,
  Separators,
  VirtualizedSectionListProps,
  ViewabilityConfigCallbackPair,
  ViewToken,
};

module.exports = {
  keyExtractor,

  get VirtualizedList(): VirtualizedList {
    return require('./Lists/VirtualizedList');
  },
  get VirtualizedSectionList(): VirtualizedSectionList {
    return require('./Lists/VirtualizedSectionList');
  },
  get VirtualizedListContextResetter(): VirtualizedListContextResetter {
    const VirtualizedListContext = require('./Lists/VirtualizedListContext');
    return VirtualizedListContext.VirtualizedListContextResetter;
  },
  get ViewabilityHelper(): ViewabilityHelper {
    return require('./Lists/ViewabilityHelper');
  },
};
