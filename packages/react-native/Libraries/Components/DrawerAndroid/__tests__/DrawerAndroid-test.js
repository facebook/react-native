/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const View = require('../../View/View').default;
// $FlowFixMe[missing-platform-support]
const DrawerLayoutAndroid = require('../DrawerLayoutAndroid.android').default;
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
