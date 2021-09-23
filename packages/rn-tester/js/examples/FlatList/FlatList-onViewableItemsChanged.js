/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';
import {FlatList_onViewableItemsChanged} from './FlatListExamples';
const React = require('react');

const VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

exports.title = 'FlatList onViewableItemsChanged';
exports.testTitle = 'Test onViewableItemsChanged callback';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description =
  'Scroll list to see what items are returned in `onViewableItemsChanged` callback.';
exports.examples = [
  {
    title: 'FlatList onViewableItemsChanged',
    render: function(): React.Element<typeof FlatList_onViewableItemsChanged> {
      return (
        <FlatList_onViewableItemsChanged
          viewabilityConfig={VIEWABILITY_CONFIG}
        />
      );
    },
  },
];
