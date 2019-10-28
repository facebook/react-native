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
const LogBoxInspectorMeta = require('../LogBoxInspectorMeta').default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorMeta', () => {
  it('should render meta information', () => {
    const output = render.shallowRender(<LogBoxInspectorMeta />);

    expect(output).toMatchSnapshot();
  });
});
