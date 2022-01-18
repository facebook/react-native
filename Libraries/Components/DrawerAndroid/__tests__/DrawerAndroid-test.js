/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
/* $FlowFixMe[cannot-resolve-module] (>=0.99.0 site=react_native_ios_fb) This
 * comment suppresses an error found when Flow v0.99 was deployed. To see the
 * error, delete this comment and run Flow. */
const DrawerLayoutAndroid = require('../DrawerLayoutAndroid.android');
const View = require('../../View/View');

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');

describe('<DrawerLayoutAndroid />', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'DrawerLayoutAndroid',
      () => (
        <DrawerLayoutAndroid
          drawerWidth={300}
          drawerPosition="left"
          renderNavigationView={() => <View />}
        />
      ),
      () => {
        jest.dontMock('../DrawerLayoutAndroid');
      },
    );
  });
});
