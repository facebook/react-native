/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const View = require('../../View/View');
const InputAccessoryView = require('../InputAccessoryView');
const render = require('../../../../jest/renderer');

describe('<InputAccessoryView />', () => {
  it('should render as <RCTInputAccessoryView> when mocked', () => {
    const instance = render.create(
      <InputAccessoryView nativeID="1">
        <View />
      </InputAccessoryView>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <InputAccessoryView> when mocked', () => {
    const output = render.shallow(
      <InputAccessoryView nativeID="1">
        <View />
      </InputAccessoryView>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <InputAccessoryView> when not mocked', () => {
    jest.dontMock('../InputAccessoryView');

    const output = render.shallow(
      <InputAccessoryView nativeID="1">
        <View />
      </InputAccessoryView>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTInputAccessoryView> when not mocked', () => {
    jest.dontMock('../InputAccessoryView');

    const instance = render.create(
      <InputAccessoryView nativeID="1">
        <View />
      </InputAccessoryView>,
    );
    expect(instance).toMatchSnapshot();
  });
});
