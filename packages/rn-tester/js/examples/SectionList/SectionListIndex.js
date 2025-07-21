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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import ContentInset from './SectionList-contentInset';
import inverted from './SectionList-inverted';
import onEndReached from './SectionList-onEndReached';
import onViewableItemsChanged from './SectionList-onViewableItemsChanged';
import onViewableItemsChanged_horizontal_noWaitForInteraction from './SectionList-onViewableItemsChanged-horizontal-noWaitForInteraction';
import onViewableItemsChanged_horizontal_offScreen_noWaitForInteraction from './SectionList-onViewableItemsChanged-horizontal-offScreen-noWaitForInteraction';
import onViewableItemsChanged_horizontal_waitForInteraction from './SectionList-onViewableItemsChanged-horizontal-waitForInteraction';
import onViewableItemsChanged_noWaitForInteraction from './SectionList-onViewableItemsChanged-noWaitForInteraction';
import onViewableItemsChanged_offScreen_noWaitForInteraction from './SectionList-onViewableItemsChanged-offScreen-noWaitForInteraction';
import onViewableItemsChanged_waitForInteraction from './SectionList-onViewableItemsChanged-waitForInteraction';
import Scrollable from './SectionList-scrollable';
import stickyHeadersEnabled from './SectionList-stickyHeadersEnabled';
import withSeparators from './SectionList-withSeparators';

exports.title = 'SectionList';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description = 'Performant, scrollable list of data.';
exports.showIndividualExamples = true;
exports.examples = [
  ContentInset,
  onEndReached,
  onViewableItemsChanged,
  withSeparators,
  stickyHeadersEnabled,
  inverted,
  Scrollable,
  onViewableItemsChanged_noWaitForInteraction,
  onViewableItemsChanged_waitForInteraction,
  onViewableItemsChanged_horizontal_noWaitForInteraction,
  onViewableItemsChanged_horizontal_waitForInteraction,
  onViewableItemsChanged_horizontal_offScreen_noWaitForInteraction,
  onViewableItemsChanged_offScreen_noWaitForInteraction,
] as Array<RNTesterModuleExample>;
