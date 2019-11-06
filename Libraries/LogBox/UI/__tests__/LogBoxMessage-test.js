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

  it('should render message with substitution', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'normal substitution normal',
          substitutions: [{length: 12, offset: 7}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render a plaintext message with no substitutions', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        plaintext
        style={{}}
        message={{
          content: 'normal substitution normal',
          substitutions: [{length: 12, offset: 7}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('Should strip "Warning: " without breaking substitution', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'Warning: normal substitution normal',
          substitutions: [{length: 12, offset: 16}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('Should strip "Warning: Warning: " without breaking substitution', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'Warning: Warning: normal substitution normal',
          substitutions: [{length: 12, offset: 25}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
