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
const PickerIOS = require('../PickerIOS');
const ReactTestRenderer = require('react-test-renderer');

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');

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

  it('defaultProps should work as expected', () => {
    const component = ReactTestRenderer.create(<Picker />);
    expect(component.root.findByType(PickerIOS).props.mode).toBe('dialog');
  });
});
