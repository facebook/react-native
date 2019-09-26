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
const DatePickerIOS = require('../DatePickerIOS');
const render = require('../../../../jest/renderer');

describe('DatePickerIOS', () => {
  it('should render as <View> when mocked', () => {
    const instance = render.create(
      <DatePickerIOS
        date={new Date(1555883690956)}
        mode="date"
        onDateChange={jest.fn()}
      />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <DatePickerIOS> when mocked', () => {
    const output = render.shallow(
      <DatePickerIOS
        date={new Date(1555883690956)}
        mode="date"
        onDateChange={jest.fn()}
      />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <DatePickerIOS> when not mocked', () => {
    jest.dontMock('../DatePickerIOS');

    const output = render.shallow(
      <DatePickerIOS
        date={new Date(1555883690956)}
        mode="date"
        onDateChange={jest.fn()}
      />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <View> when not mocked', () => {
    jest.dontMock('../DatePickerIOS');

    const instance = render.create(
      <DatePickerIOS
        date={new Date(1555883690956)}
        mode="date"
        onDateChange={jest.fn()}
      />,
    );
    expect(instance).toMatchSnapshot();
  });
});
