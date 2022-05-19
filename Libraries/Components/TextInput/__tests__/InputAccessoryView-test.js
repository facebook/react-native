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
/* $FlowFixMe[cannot-resolve-module] (>=0.99.0 site=react_native_ios_fb) This
 * comment suppresses an error found when Flow v0.99 was deployed. To see the
 * error, delete this comment and run Flow. */
const InputAccessoryView = require('../InputAccessoryView.ios');
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
