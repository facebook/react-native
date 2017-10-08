/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');
const Image = require('Image');
const View = require('View');

it('renders assets based on relative path', () => {
  expect(ReactTestRenderer.create(
  <View>
    <Image source={require('./img/img1.png')} />
    <Image source={require('./img/img2.png')} />
  </View>
  )).toMatchSnapshot();
});
