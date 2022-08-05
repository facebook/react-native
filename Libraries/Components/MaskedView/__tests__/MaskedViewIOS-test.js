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
const Text = require('../../../Text/Text');
const View = require('../../View/View');
const MaskedViewIOS = require('../MaskedViewIOS');

const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');

describe('<MaskedViewIOS />', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'MaskedViewIOS',
      () => (
        <MaskedViewIOS
          maskElement={
            <View>
              <Text>Basic Mask</Text>
            </View>
          }>
          <View />
        </MaskedViewIOS>
      ),
      () => {
        jest.dontMock('../MaskedViewIOS');
      },
    );
  });
});
