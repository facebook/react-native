/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const {create} = require('../../../../jest/renderer');
const Text = require('../../../Text/Text');
const TouchableOpacity = require('../TouchableOpacity');
const React = require('react');

describe('TouchableOpacity', () => {
  it('renders correctly', async () => {
    const instance = await create(
      <TouchableOpacity>
        <Text>Touchable</Text>
      </TouchableOpacity>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('renders in disabled state when a disabled prop is passed', async () => {
    const instance = await create(
      <TouchableOpacity disabled={true}>
        <Text>Touchable</Text>
      </TouchableOpacity>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('renders in disabled state when a key disabled in accessibilityState is passed', async () => {
    const instance = await create(
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
