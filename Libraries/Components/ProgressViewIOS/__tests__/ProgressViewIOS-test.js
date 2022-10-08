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
const ProgressViewIOS = require('../ProgressViewIOS');
const React = require('react');

describe('<ProgressViewIOS />', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'ProgressViewIOS',
      () => <ProgressViewIOS progress={90} />,
      () => {
        jest.dontMock('../ProgressViewIOS');
      },
    );
  });
});
