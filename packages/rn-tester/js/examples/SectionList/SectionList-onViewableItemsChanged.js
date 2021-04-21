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
import {SectionList_onViewableItemsChanged} from './SectionListExamples';
const React = require('react');

const VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

exports.title = 'SectionList onViewableItemsChanged';
exports.testTitle = 'Test onViewableItemsChanged callback';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description =
  'Scroll list to see what items are returned in `onViewableItemsChanged` callback.';
exports.examples = [
  {
    title: 'SectionList onViewableItemsChanged',
    render: function(): React.Element<
      typeof SectionList_onViewableItemsChanged,
    > {
      return (
        <SectionList_onViewableItemsChanged
          viewabilityConfig={VIEWABILITY_CONFIG}
        />
      );
    },
  },
];
