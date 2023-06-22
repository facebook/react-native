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

const render = require('../../../jest/renderer');
const Image = require('../Image');
const React = require('react');

describe('<Image />', () => {
  test('should render as <Image> when mocked', () => {
    const instance = render.create(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(instance).toMatchSnapshot();
  });

  test('should shallow render as <Image> when mocked', () => {
    const output = render.shallow(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(output).toMatchSnapshot();
  });

  test('should shallow render as <ForwardRef(Image)> when not mocked', () => {
    jest.dontMock('../Image');

    const output = render.shallow(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(output).toMatchSnapshot();
  });

  test('should render as <RCTImageView> when not mocked', () => {
    jest.dontMock('../Image');

    const instance = render.create(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(instance).toMatchSnapshot();
  });
});
