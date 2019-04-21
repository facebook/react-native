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

const React = require('React');
const AndroidDrawerLayout = require('../DrawerLayoutAndroid.android');
const View = require('View');

const render = require('../../../../jest/renderer');

jest.mock('UIManager', () => ({
  getViewManagerConfig: jest.fn(() => ({Constants: {}})),
}));

describe('<AndroidDrawerLayout />', () => {
  it('should render as <AndroidDrawerLayout> when mocked', () => {
    const instance = render.create(
      <AndroidDrawerLayout renderNavigationView={() => <View />} />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <DrawerLayoutAndroid> when mocked', () => {
    const output = render.shallow(
      <AndroidDrawerLayout renderNavigationView={() => <View />} />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <DrawerLayoutAndroid> when not mocked', () => {
    jest.dontMock('DrawerLayoutAndroid');

    const output = render.shallow(
      <AndroidDrawerLayout renderNavigationView={() => <View />} />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <AndroidDrawerLayout> when not mocked', () => {
    jest.dontMock('DrawerLayoutAndroid');

    const instance = render.create(
      <AndroidDrawerLayout renderNavigationView={() => <View />} />,
    );
    expect(instance).toMatchSnapshot();
  });
});
