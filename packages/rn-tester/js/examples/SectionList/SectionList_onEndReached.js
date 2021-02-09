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

exports.title = 'SectionList onEndReached';
exports.testTitle = 'Test onEndReached callback';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description =
  'Scroll to end of list or tap Test button to see `onEndReached` triggered.';
exports.examples = [
  {
    title: '',
    render: function(): React.Element<typeof SectionListExamples> {
      return <SectionListExamples example="onEndReached" />;
    },
  },
];
