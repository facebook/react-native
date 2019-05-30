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
const Picker = require('../Picker');

const render = require('../../../../jest/renderer');

describe('<Picker />', () => {
  it('should render as <View> when mocked', () => {
    const instance = render.create(
      <Picker selectedValue="foo" onValueChange={jest.fn()}>
        <Picker.Item label="foo" value="foo" />
        <Picker.Item label="bar" value="bar" />
      </Picker>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <Picker> when mocked', () => {
    const output = render.shallow(
      <Picker selectedValue="foo" onValueChange={jest.fn()}>
        <Picker.Item label="foo" value="foo" />
        <Picker.Item label="bar" value="bar" />
      </Picker>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <Picker> when not mocked', () => {
    jest.dontMock('../Picker');

    const output = render.shallow(
      <Picker selectedValue="foo" onValueChange={jest.fn()}>
        <Picker.Item label="foo" value="foo" />
        <Picker.Item label="bar" value="bar" />
      </Picker>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <View> when not mocked', () => {
    jest.dontMock('../Picker');

    const instance = render.create(
      <Picker selectedValue="foo" onValueChange={jest.fn()}>
        <Picker.Item label="foo" value="foo" />
        <Picker.Item label="bar" value="bar" />
      </Picker>,
    );
    expect(instance).toMatchSnapshot();
  });
});
