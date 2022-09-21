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

const React = require('react');
import SafeAreaView from '../SafeAreaView';
const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const View = require('../../View/View');
const Text = require('../../../Text/Text');

describe('<SafeAreaView />', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'SafeAreaView',
      () => (
        <SafeAreaView>
          <View>
            <Text>Hello World!</Text>
          </View>
        </SafeAreaView>
      ),
      () => {
        jest.dontMock('../SafeAreaView');
      },
    );
  });
});
