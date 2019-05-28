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
// $FlowFixMe
const ProgressBarAndroid = require('../ProgressBarAndroid.android');

const render = require('../../../../jest/renderer');

describe('<ProgressBarAndroid />', () => {
  it('should render as <ProgressBarAndroid> when mocked', () => {
    const instance = render.create(
      <ProgressBarAndroid styleAttr="Horizontal" />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(ProgressBarAndroid)> when mocked', () => {
    const output = render.shallow(
      <ProgressBarAndroid styleAttr="Horizontal" />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(ProgressBarAndroid)> when not mocked', () => {
    jest.dontMock('../ProgressBarAndroid');

    const output = render.shallow(
      <ProgressBarAndroid styleAttr="Horizontal" />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <ProgressBarAndroid> when not mocked', () => {
    jest.dontMock('../ProgressBarAndroid');

    const instance = render.create(
      <ProgressBarAndroid styleAttr="Horizontal" />,
    );
    expect(instance).toMatchSnapshot();
  });
});
