/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
const SoftInputView = require('../SoftInputView');
const render = require('../../../../jest/renderer');

describe('<SoftInputView />', () => {
  it('should render as <RCTSoftInputView> when mocked', () => {
    const instance = render.create(
      <SoftInputView nativeID="1">
        <View />
      </SoftInputView>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <SoftInputView> when mocked', () => {
    const output = render.shallow(
      <SoftInputView nativeID="1">
        <View />
      </SoftInputView>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <SoftInputView> when not mocked', () => {
    jest.dontMock('../SoftInputView');

    const output = render.shallow(
      <SoftInputView nativeID="1">
        <View />
      </SoftInputView>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTSoftInputView> when not mocked', () => {
    jest.dontMock('../SoftInputView');

    const instance = render.create(
      <SoftInputView nativeID="1">
        <View />
      </SoftInputView>,
    );
    expect(instance).toMatchSnapshot();
  });
});
