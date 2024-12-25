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

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const View = require('../../View/View');
/* $FlowFixMe[cannot-resolve-module] (>=0.99.0 site=react_native_ios_fb) This
 * comment suppresses an error found when Flow v0.99 was deployed. To see the
 * error, delete this comment and run Flow. */
// $FlowFixMe[missing-platform-support]
const DrawerLayoutAndroid = require('../DrawerLayoutAndroid.android');
const React = require('react');

describe('<DrawerLayoutAndroid />', () => {
  it('should render as expected', async () => {
    await ReactNativeTestTools.expectRendersMatchingSnapshot(
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
