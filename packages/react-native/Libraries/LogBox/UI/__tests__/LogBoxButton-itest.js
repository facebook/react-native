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
import LogBoxButton from 'react-native/Libraries/LogBox/UI/LogBoxButton';
import * as React from 'react';
import {Text} from 'react-native';

describe('LogBoxButton', () => {
  it('should render only a view without an onPress', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <LogBoxButton
          backgroundColor={{
            default: 'black',
            pressed: 'red',
          }}>
          <Text>Press me</Text>
        </LogBoxButton>,
      );
    });

    // When there is no onPress, the component renders a View wrapping children.
    // StyleSheet.compose with no additional style results in an array output
    // from the renderer (two sibling nodes), compared via toJSON array form.
    const output = root.getRenderedOutput({props: []}).toJSON();
    expect(Array.isArray(output)).toBe(true);
    if (Array.isArray(output)) {
      expect(output).toHaveLength(2);
      expect(output[0]).toEqual({type: 'View', props: {}, children: []});
      expect(output[1]).toEqual({
        type: 'Paragraph',
        props: {},
        children: ['Press me'],
      });
    }
  });

  it('should render a view with onPress provided', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <LogBoxButton
          backgroundColor={{
            default: 'black',
            pressed: 'red',
          }}
          hitSlop={{}}
          onPress={() => {}}>
          <Text>Press me</Text>
        </LogBoxButton>,
      );
    });

    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-view>
        <rn-paragraph>Press me</rn-paragraph>
      </rn-view>,
    );
  });
});
