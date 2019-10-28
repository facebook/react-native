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
const LogBoxInspectorSourceMapStatus = require('../LogBoxInspectorSourceMapStatus')
  .default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorSourceMapStatus', () => {
  it('should render complete', () => {
    const output = render.shallowRender(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="COMPLETE" />,
    );

    expect(output).toMatchSnapshot();
  });
});
