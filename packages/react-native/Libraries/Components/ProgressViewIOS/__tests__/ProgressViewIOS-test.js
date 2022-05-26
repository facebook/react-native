/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const ProgressViewIOS = require('../ProgressViewIOS');

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');

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
