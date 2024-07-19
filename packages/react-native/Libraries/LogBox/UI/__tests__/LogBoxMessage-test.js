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

const render = require('../../../../jest/renderer');
const LogBoxMessage = require('../LogBoxMessage').default;
const React = require('react');

describe('LogBoxMessage', () => {
  it('should render message', async () => {
    const output = await render.create(
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

  it('should render message truncated to 6 chars', async () => {
    const output = await render.create(
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

  it('should render the whole message when maxLength = message length', async () => {
    const message = 'Some kind of message';
    const output = await render.create(
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

  it('should render message with substitution', async () => {
    const output = await render.create(
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

  it('should render message with substitution, truncating the first word 3 letters in', async () => {
    const output = await render.create(
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

  it('should render message with substitution, truncating the second word 6 letters in', async () => {
    const output = await render.create(
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

  it('should render message with substitution, truncating the third word 2 letters in', async () => {
    const output = await render.create(
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

  it('should render the whole message with substitutions when maxLength = message length', async () => {
    const message = 'normal substitution normal';
    const output = await render.create(
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

  it('should render a plaintext message with no substitutions', async () => {
    const output = await render.create(
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

  it('should render a plaintext message and clean the content', async () => {
    const output = await render.create(
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

  it('Should strip "TransformError " without breaking substitution', async () => {
    const output = await render.create(
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

  it('Should strip "Warning: " without breaking substitution', async () => {
    const output = await render.create(
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

  it('Should strip "Warning: Warning: " without breaking substitution', async () => {
    const output = await render.create(
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

  it('Should make links tappable', async () => {
    const output = await render.create(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'https://reactnative.dev',
          substitutions: [],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('Should handle multiple links', async () => {
    const output = await render.create(
      <LogBoxMessage
        style={{}}
        message={{
          content: 'https://reactnative.dev and https://react.dev',
          substitutions: [],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('Should handle truncated links', async () => {
    const output = await render.create(
      <LogBoxMessage
        style={{}}
        maxLength={35}
        message={{
          content: 'https://reactnative.dev and https://react.dev',
          substitutions: [],
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
