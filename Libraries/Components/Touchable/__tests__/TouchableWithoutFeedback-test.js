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
const TouchableWithoutFeedback = require('../TouchableWithoutFeedback');

const render = require('../../../../jest/renderer');

describe('TouchableWithoutFeedback', () => {
  it('renders correctly', () => {
    const instance = render.create(
      <TouchableWithoutFeedback style={{}}>
        <Text>Touchable</Text>
      </TouchableWithoutFeedback>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('has displayName', () => {
    expect(TouchableWithoutFeedback.displayName).toEqual(
      'TouchableWithoutFeedback',
    );
  });
});
