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
const ActivityIndicator = require('../ActivityIndicator');
const render = require('../../../../jest/renderer');

describe('<ActivityIndicator />', () => {
  it('should set displayName to prevent <Component /> regressions', () => {
    expect(ActivityIndicator.displayName).toBe('ActivityIndicator');
  });

  it('should render as <ActivityIndicator> when mocked', () => {
    const instance = render.create(
      <ActivityIndicator size="large" color="#0000ff" />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <ActivityIndicator> when mocked', () => {
    const output = render.shallow(
      <ActivityIndicator size="large" color="#0000ff" />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(ActivityIndicator)> when not mocked', () => {
    jest.dontMock('../ActivityIndicator');

    const output = render.shallow(
      <ActivityIndicator size="large" color="#0000ff" />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <View> when not mocked', () => {
    jest.dontMock('../ActivityIndicator');

    const instance = render.create(
      <ActivityIndicator size="large" color="#0000ff" />,
    );
    expect(instance).toMatchSnapshot();
  });
});
