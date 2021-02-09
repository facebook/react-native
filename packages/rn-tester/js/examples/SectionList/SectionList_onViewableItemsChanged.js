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
import SectionListExamples from './SectionListExamples';
const React = require('react');

exports.title = 'SectionList onViewableItemsChanged';
exports.testTitle = 'Test onViewableItemsChanged callback';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description =
  'Scroll list to see what items are returned in `onViewableItemsChanged` callback.';
exports.examples = [
  {
    title: 'Simple scrollable list',
    render: function(): React.Element<typeof SectionListExamples> {
      return <SectionListExamples example="onViewableItemsChanged" />;
    },
  },
];
