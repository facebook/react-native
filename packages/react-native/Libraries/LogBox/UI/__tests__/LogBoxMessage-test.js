/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow strict-local
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

  it('should render message truncated to 6 chars', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        maxLength={5}
        message={{
          content: 'Some kind of message',
          substitutions: [],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the whole message when maxLength = message length', () => {
    const message = 'Some kind of message';
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        maxLength={message.length}
        message={{
          content: message,
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

  it('should render message with substitution, truncating the first word 3 letters in', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        maxLength={3}
        message={{
          content: 'normal substitution normal',
          substitutions: [{length: 12, offset: 7}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render message with substitution, truncating the second word 6 letters in', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        maxLength={13}
        message={{
          content: 'normal substitution normal',
          substitutions: [{length: 12, offset: 7}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render message with substitution, truncating the third word 2 letters in', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        maxLength={22}
        message={{
          content: 'normal substitution normal',
          substitutions: [{length: 12, offset: 7}],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the whole message with substitutions when maxLength = message length', () => {
    const message = 'normal substitution normal';
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        maxLength={message.length}
        message={{
          content: message,
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

  it('should render a plaintext message and clean the content', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        plaintext
        style={{}}
        message={{
          content: 'Error: This should not start with Error:',
          substitutions: [],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('Should strip "TransformError " without breaking substitution', () => {
    const output = render.shallowRender(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'TransformError normal substitution normal',
          substitutions: [{length: 12, offset: 22}],
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
