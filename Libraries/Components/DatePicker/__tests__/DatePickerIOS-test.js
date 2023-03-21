/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const DatePickerIOS = require('../DatePickerIOS');
const React = require('react');

describe('DatePickerIOS', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'DatePickerIOS',
      () => (
        <DatePickerIOS
          date={new Date(1555883690956)}
          mode="date"
          onDateChange={jest.fn()}
        />
      ),
      () => {
        jest.dontMock('../DatePickerIOS');
      },
    );
  });
  it('should render DatePicker with the datetime mode if no mode is passed inside the props', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'DatePickerIOS',
      () => (
        <DatePickerIOS
          date={new Date(1555883690956)}
          onDateChange={jest.fn()}
        />
      ),
      () => {
        jest.dontMock('../DatePickerIOS');
      },
    );
  });
});
