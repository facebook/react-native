/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {PopupMenuAndroidInstance} from '@react-native/popup-menu-android';
import type {Node} from 'react';

import PopupMenuAndroid from '@react-native/popup-menu-android';
import * as React from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';

type Fruit = 'Apple' | 'Pear' | 'Banana' | 'Orange' | 'Kiwi';

const PopupMenu = () => {
  const popupRef = React.useRef<?PopupMenuAndroidInstance>();
  const [fruit, setFruit] = React.useState<?Fruit>();
  const fruits: Array<Fruit> = ['Apple', 'Pear', 'Banana', 'Orange', 'Kiwi'];
  const items = fruits.map(item => ({
    label: item,
    onPress: () => {
      setFruit(item);
    },
  }));

  return (
    <View style={styles.container}>
      {fruit ? <Text>Selected {fruit}</Text> : null}
      <PopupMenuAndroid
        instanceRef={popupRef}
        menuItems={items.map(({label}) => label)}
        onSelectionChange={selection => items[selection].onPress()}>
        <Button
          title="Show PopupMenu!"
          onPress={() => {
            popupRef.current?.show();
          }}
        />
      </PopupMenuAndroid>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

exports.title = 'PopupMenuAndroid';
// TODO(T175446328): Publish oss documentation for PopupMenuAndroid
exports.description = 'PopupMenuAndroid Example';
exports.examples = [
  {
    title: 'PopupMenu Example',
    render(): Node {
      return <PopupMenu />;
    },
  },
];
