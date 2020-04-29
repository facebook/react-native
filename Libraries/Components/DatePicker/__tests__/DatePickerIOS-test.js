/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

'use strict';

const React = require('react');
const DatePickerIOS = require('../DatePickerIOS');

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');

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
});
