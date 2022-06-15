/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const Text = require('../../../Text/Text');
const TouchableOpacity = require('../TouchableOpacity');

describe('TouchableOpacity', () => {
  it('renders correctly', () => {
    const instance = ReactTestRenderer.create(
      <TouchableOpacity>
        <Text>Touchable</Text>
      </TouchableOpacity>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('renders in disabled state when a disabled prop is passed', () => {
    const instance = ReactTestRenderer.create(
      <TouchableOpacity disabled={true}>
        <Text>Touchable</Text>
      </TouchableOpacity>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('renders in disabled state when a key disabled in accessibilityState is passed', () => {
    const instance = ReactTestRenderer.create(
      <TouchableOpacity accessibilityState={{disabled: true}}>
        <Text>Touchable</Text>
      </TouchableOpacity>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('has displayName', () => {
    expect(TouchableOpacity.displayName).toEqual('TouchableOpacity');
  });
});
