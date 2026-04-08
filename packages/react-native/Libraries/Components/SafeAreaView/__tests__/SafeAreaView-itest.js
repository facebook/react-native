/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {SafeAreaView, Text, View} from 'react-native';

describe('<SafeAreaView>', () => {
  it('renders with children', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <SafeAreaView collapsable={false}>
          <View collapsable={false}>
            <Text>Hello World!</Text>
          </View>
        </SafeAreaView>,
      );
    });

    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-view>
        <rn-view>
          <rn-paragraph>Hello World!</rn-paragraph>
        </rn-view>
      </rn-view>,
    );
  });
});
