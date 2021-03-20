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
import {SectionList_inverted} from './SectionListExamples';
const React = require('react');

exports.title = 'SectionList inverted';
exports.testTitle = 'Test inverted prop';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description = 'Toggle inverted to see list inverted.';
exports.examples = [
  {
    title: 'SectionList inverted',
    render: function(): React.Element<typeof SectionList_inverted> {
      return <SectionList_inverted />;
    },
  },
];
