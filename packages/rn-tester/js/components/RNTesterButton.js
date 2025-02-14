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

import type {GestureResponderEvent} from 'react-native/Libraries/Types/CoreEventTypes';

import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

type Props = $ReadOnly<{
  testID?: string,
  textTestID?: string,
  children?: React.Node,
  onPress?: ?(event: GestureResponderEvent) => mixed,
}>;

function RNTesterButton(props: Props): React.Node {
  return (
    <Pressable
      testID={props.testID}
      onPress={props.onPress}
      style={({pressed}) => [styles.button, pressed && styles.pressed]}>
      <Text testID={props.textTestID}>{props.children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderColor: '#696969',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d3d3d3',
  },
  pressed: {
    backgroundColor: '#a9a9a9',
  },
});

export default RNTesterButton;
