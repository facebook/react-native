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
const ImageBackground = require('../ImageBackground');
const React = require('react');

describe('<ImageBackground />', () => {
  test('should render as <ImageBackground> when mocked', () => {
    const instance = render.create(
      <ImageBackground
        style={{width: 150, height: 50}}
        source={{uri: 'foo-bar.jpg'}}
      />,
    );
    expect(instance).toMatchSnapshot();
  });

  test('should shallow render as <ImageBackground> when mocked', () => {
    const output = render.shallow(
      <ImageBackground
        style={{width: 150, height: 50}}
        source={{uri: 'foo-bar.jpg'}}
      />,
    );
    expect(output).toMatchSnapshot();
  });

  test('should shallow render as <ForwardRef(ImageBackground)> when not mocked', () => {
    jest.dontMock('../ImageBackground');

    const output = render.shallow(
      <ImageBackground
        style={{width: 150, height: 50}}
        source={{uri: 'foo-bar.jpg'}}
      />,
    );
    expect(output).toMatchSnapshot();
  });

  test('should render as <RCTImageView> when not mocked', () => {
    jest.dontMock('../ImageBackground');

    const instance = render.create(
      <ImageBackground
        style={{width: 150, height: 50}}
        source={{uri: 'foo-bar.jpg'}}
      />,
    );
    expect(instance).toMatchSnapshot();
  });

  test('should be set importantForAccessibility in <View> and <Image>', () => {
    const instance = render.create(
      <ImageBackground
        importantForAccessibility={'no'}
        style={{width: 150, height: 50}}
        source={{uri: 'foo-bar.jpg'}}
      />,
    );
    expect(instance).toMatchSnapshot();
  });
});
