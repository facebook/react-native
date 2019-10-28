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
const LogBoxInspectorMessageHeader = require('../LogBoxInspectorMessageHeader')
  .default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorMessageHeader', () => {
  it('should not render collapse button for short content', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        collapsed={false}
        message={{
          content: 'Short',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render "collapse" if expanded', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        collapsed={false}
        message={{content: '#'.repeat(200), substitutions: []}}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render "see more" if collapsed', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        collapsed={true}
        message={{
          content: '#'.repeat(200),
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
