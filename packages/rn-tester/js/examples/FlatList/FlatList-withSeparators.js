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
import {FlatList_withSeparators} from './FlatListExamples';
const React = require('react');

exports.title = 'FlatList with Separators';
exports.testTitle = 'Test custom separator components';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description = 'Tap to see pressed states for separator components.';
exports.examples = [
  {
    title: 'FlatList with Separators',
    render: function(): React.Element<typeof FlatList_withSeparators> {
      return <FlatList_withSeparators />;
    },
  },
];
