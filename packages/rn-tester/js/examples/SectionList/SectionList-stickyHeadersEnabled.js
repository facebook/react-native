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
import {SectionList_stickySectionHeadersEnabled} from './SectionListExamples';
const React = require('react');

exports.title = 'SectionList stickySectionHeadersEnabled';
exports.testTitle = 'Test stickySectionHeadersEnabled prop';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description =
  'Toggle stickySectionHeadersEnabled to see section headers stick.';
exports.examples = [
  {
    title: 'SectionList stickySectionHeadersEnabled',
    render: function(): React.Element<
      typeof SectionList_stickySectionHeadersEnabled,
    > {
      return <SectionList_stickySectionHeadersEnabled />;
    },
  },
];
