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
const Image = require('../Image');
const render = require('../../../jest/renderer');

describe('<Image />', () => {
  it('should render as <Image> when mocked', () => {
    const instance = render.create(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <Image> when mocked', () => {
    const output = render.shallow(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(Image)> when not mocked', () => {
    jest.dontMock('../Image');

    const output = render.shallow(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTImageView> when not mocked', () => {
    jest.dontMock('../Image');

    const instance = render.create(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(instance).toMatchSnapshot();
  });
});
