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

const React = require('react');
const Text = require('../../../Text/Text');
const TouchableOpacity = require('../TouchableOpacity');

const render = require('../../../../jest/renderer');

describe('TouchableOpacity', () => {
  it('renders correctly', () => {
    const instance = render.create(
      <TouchableOpacity style={{}}>
        <Text>Touchable</Text>
      </TouchableOpacity>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('has displayName', () => {
    expect(TouchableOpacity.displayName).toEqual('TouchableOpacity');
  });
});
