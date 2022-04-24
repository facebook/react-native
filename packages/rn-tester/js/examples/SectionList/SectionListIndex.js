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

import Scrollable from './SectionList-scrollable';
import ContentInset from './SectionList-contentInset';
import onEndReached from './SectionList-onEndReached';
import onViewableItemsChanged from './SectionList-onViewableItemsChanged';
import withSeparators from './SectionList-withSeparators';
import stickyHeadersEnabled from './SectionList-stickyHeadersEnabled';
import inverted from './SectionList-inverted';

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
];
