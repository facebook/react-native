/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import * as React from 'react';
import {Text, Pressable, StyleSheet, View} from 'react-native';
import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import {RNTesterThemeContext} from './RNTesterTheme';

type Props = $ReadOnly<{|
  testID?: ?string,
  label: string,
  onPress?: ?(event: PressEvent) => mixed,
  selected?: ?boolean,
  multiSelect?: ?boolean,
  disabled?: ?boolean,
  style?: ViewStyleProp,
|}>;

/**
 * A reusable toggle button component for RNTester. Highlights when selected.
 */
export default function RNTOption(props: Props): React.Node {
  const [pressed, setPressed] = React.useState(false);
  const theme = React.useContext(RNTesterThemeContext);

  return (
    <Pressable
      accessibilityState={{selected: !!props.selected}}
      disabled={
        props.disabled === false || props.multiSelect === true
          ? false
          : props.selected
      }
      hitSlop={4}
      onPress={props.onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      testID={props.testID}>
      <View
        style={[
          styles.container,
          props.selected === true ? styles.selected : null,
          pressed && props.selected !== true ? styles.pressed : null,
          props.disabled === true
            ? [
                styles.disabled,
                {backgroundColor: theme.TertiarySystemFillColor},
              ]
            : null,
          props.style,
        ]}>
        <Text style={styles.label}>{props.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    backgroundColor: 'rgba(100,215,255,.3)',
  },
  label: {
    color: 'black',
  },
  selected: {
    backgroundColor: 'rgba(100,215,255,.3)',
    borderColor: 'rgba(100,215,255,.3)',
  },
  disabled: {borderWidth: 0},
  container: {
    borderColor: 'rgba(0,0,0, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
});
