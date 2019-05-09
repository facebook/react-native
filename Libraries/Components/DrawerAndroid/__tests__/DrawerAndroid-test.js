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
// $FlowFixMe
const DrawerLayoutAndroid = require('../DrawerLayoutAndroid.android');
const View = require('../../View/View');

const render = require('../../../../jest/renderer');

describe('<DrawerLayoutAndroid />', () => {
  it('should render as <DrawerLayoutAndroid> when mocked', () => {
    const instance = render.create(
      <DrawerLayoutAndroid
        drawerWidth={300}
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        renderNavigationView={() => <View />}
      />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <DrawerLayoutAndroid> when mocked', () => {
    const output = render.shallow(
      <DrawerLayoutAndroid
        drawerWidth={300}
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        renderNavigationView={() => <View />}
      />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <DrawerLayoutAndroid> when not mocked', () => {
    jest.dontMock('../DrawerLayoutAndroid');

    const output = render.shallow(
      <DrawerLayoutAndroid
        drawerWidth={300}
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        renderNavigationView={() => <View />}
      />,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <DrawerLayoutAndroid> when not mocked', () => {
    jest.dontMock('../DrawerLayoutAndroid');

    const instance = render.create(
      <DrawerLayoutAndroid
        drawerWidth={300}
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        renderNavigationView={() => <View />}
      />,
    );
    expect(instance).toMatchSnapshot();
  });
});
