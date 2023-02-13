/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

import * as React from 'react';

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const ActivityIndicator = require('../ActivityIndicator').default;

describe('<ActivityIndicator />', () => {
  it('should set displayName to prevent <Component /> regressions', () => {
    expect(ActivityIndicator.displayName).toBe('ActivityIndicator');
  });

  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'ActivityIndicator',
      () => <ActivityIndicator size="large" color="#0000ff" />,
      () => {
        jest.dontMock('../ActivityIndicator');
      },
    );
  });
});
