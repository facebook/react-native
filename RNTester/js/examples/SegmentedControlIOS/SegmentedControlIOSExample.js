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

const React = require('react');
const {
  BasicSegmentedControlExample,
  PreSelectedSegmentedControlExample,
  MomentarySegmentedControlExample,
  DisabledSegmentedControlExample,
  ColorSegmentedControlExample,
  EventSegmentedControlExample,
} = require('./SegmentedControlExampleComponents');

exports.title = '<SegmentedControlIOS>';
exports.displayName = 'SegmentedControlExample';
exports.description = 'Native segmented control';
exports.examples = [
  {
    title: 'Segmented controls can have values',
    render(): React.Element<any> {
      return <BasicSegmentedControlExample />;
    },
  },
  {
    title: 'Segmented controls can have a pre-selected value',
    render(): React.Element<any> {
      return <PreSelectedSegmentedControlExample />;
    },
  },
  {
    title: 'Segmented controls can be momentary',
    render(): React.Element<any> {
      return <MomentarySegmentedControlExample />;
    },
  },
  {
    title: 'Segmented controls can be disabled',
    render(): React.Element<any> {
      return <DisabledSegmentedControlExample />;
    },
  },
  {
    title: 'Custom colors can be provided',
    render(): React.Element<any> {
      return <ColorSegmentedControlExample />;
    },
  },
  {
    title: 'Change events can be detected',
    render(): React.Element<any> {
      return <EventSegmentedControlExample />;
    },
  },
];
