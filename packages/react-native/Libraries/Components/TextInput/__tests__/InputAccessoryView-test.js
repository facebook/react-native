/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const render = require('../../../../jest/renderer');
const View = require('../../View/View');
const InputAccessoryView = require('../InputAccessoryView').default;
const React = require('react');

describe('InputAccessoryView', () => {
  it('should render as <RCTInputAccessoryView> when mocked', async () => {
    const instance = await render.create(
      <InputAccessoryView nativeID="1">
        <View />
      </InputAccessoryView>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should render as <RCTInputAccessoryView> when not mocked', async () => {
    jest.dontMock('../InputAccessoryView');

    const instance = await render.create(
      <InputAccessoryView nativeID="1">
        <View />
      </InputAccessoryView>,
    );
    expect(instance).toMatchSnapshot();
  });
});
