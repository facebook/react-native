/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');
const ActivityIndicator = require('ActivityIndicator');

describe('ActivityIndicator', () => {
  it('renders correctly', () => {
    const instance = ReactTestRenderer.create(
      <ActivityIndicator size="large" color="#0000ff" />,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });
});
