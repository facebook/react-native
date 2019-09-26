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
const Text = require('../../../Text/Text');
const View = require('../../View/View');
const MaskedViewIOS = require('../MaskedViewIOS');

const render = require('../../../../jest/renderer');

describe('<MaskedViewIOS />', () => {
  it('should render as <RCTMaskedView> when mocked', () => {
    const instance = render.create(
      <MaskedViewIOS
        maskElement={
          <View>
            <Text>Basic Mask</Text>
          </View>
        }>
        <View />
      </MaskedViewIOS>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <MaskedViewIOS> when mocked', () => {
    const output = render.shallow(
      <MaskedViewIOS
        maskElement={
          <View>
            <Text>Basic Mask</Text>
          </View>
        }>
        <View />
      </MaskedViewIOS>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <MaskedViewIOS> when not mocked', () => {
    jest.dontMock('../MaskedViewIOS');

    const output = render.shallow(
      <MaskedViewIOS
        maskElement={
          <View>
            <Text>Basic Mask</Text>
          </View>
        }>
        <View />
      </MaskedViewIOS>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTMaskedView> when not mocked', () => {
    jest.dontMock('../MaskedViewIOS');

    const instance = render.create(
      <MaskedViewIOS
        maskElement={
          <View>
            <Text>Basic Mask</Text>
          </View>
        }>
        <View />
      </MaskedViewIOS>,
    );
    expect(instance).toMatchSnapshot();
  });
});
