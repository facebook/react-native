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
import {FlatList_onEndReached} from './FlatListExamples';
const React = require('react');

exports.title = 'FlatList onEndReached';
exports.testTitle = 'Test onEndReached callback';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/flatlist';
exports.description =
  'Scroll to end of list or tap Test button to see `onEndReached` triggered.';
exports.examples = [
  {
    title: 'FlatList onEndReached',
    render: function(): React.Element<typeof FlatList_onEndReached> {
      return <FlatList_onEndReached />;
    },
  },
];
