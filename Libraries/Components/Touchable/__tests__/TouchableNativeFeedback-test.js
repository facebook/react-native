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
const TouchableNativeFeedback = require('../TouchableNativeFeedback');

const render = require('../../../../jest/renderer');

describe('TouchableWithoutFeedback', () => {
  it('renders correctly', () => {
    const instance = render.create(
      <TouchableNativeFeedback style={{}}>
        <Text>Touchable</Text>
      </TouchableNativeFeedback>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('has displayName', () => {
    expect(TouchableNativeFeedback.displayName).toEqual(
      'TouchableNativeFeedback',
    );
  });
});
