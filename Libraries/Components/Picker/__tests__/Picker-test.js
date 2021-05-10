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
const Picker = require('../Picker');
/* $FlowFixMe[cannot-resolve-module] (>=0.99.0 site=react_native_ios_fb) This
 * comment suppresses an error found when Flow v0.99 was deployed. To see the
 * error, delete this comment and run Flow. */
const PickerAndroid = require('../PickerAndroid.android');
const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const render = require('../../../../jest/renderer');

describe('<Picker />', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'Picker',
      () => (
        <Picker selectedValue="foo" onValueChange={jest.fn()}>
          <Picker.Item label="foo" value="foo" />
          <Picker.Item label="bar" value="bar" />
        </Picker>
      ),
      () => {
        jest.dontMock('../Picker');
      },
    );
  });
});

describe('<Picker /> on Android', () => {
  beforeEach(() => {
    jest.doMock('../AndroidDialogPickerNativeComponent', () => 'PickerAndroid');
  });

  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../AndroidDialogPickerNativeComponent');
  });

  it('should be set importantForAccessibility={no-hide-descendants} when importantForAccessibility={no-hide-descendants}', () => {
    expect(
      render.create(
        <PickerAndroid
          importantForAccessibility={'no-hide-descendants'}
          selectedValue="foo"
          onValueChange={jest.fn()}>
          <Picker.Item label="bar" value="bar" />
        </PickerAndroid>,
      ),
    ).toMatchSnapshot();
  });

  it('should be set importantForAccessibility={no-hide-descendants} when importantForAccessibility={no}', () => {
    expect(
      render.create(
        <PickerAndroid
          importantForAccessibility={'no'}
          selectedValue="foo"
          onValueChange={jest.fn()}>
          <Picker.Item label="bar" value="bar" />
        </PickerAndroid>,
      ),
    ).toMatchSnapshot();
  });
});
