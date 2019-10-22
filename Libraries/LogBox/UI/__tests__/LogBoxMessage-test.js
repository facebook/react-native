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
const LogBoxMessage = require('../LogBoxMessage').default;
const render = require('../../../../jest/renderer');

describe('LogBoxMessage', () => {
  it('should render message', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'Some kind of message',
          substitutions: [],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  // TODO: Add tests for text substitutions
});
