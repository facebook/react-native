/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

jest.disableAutomock();

const View = require('../../Components/View/View');
const Image = require('../Image');
const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

it('renders assets based on relative path', () => {
  expect(
    ReactTestRenderer.create(
      <View>
        <Image source={require('./img/img1.png')} />
        <Image source={require('./img/img2.png')} />
      </View>,
    ),
  ).toMatchSnapshot();
});
