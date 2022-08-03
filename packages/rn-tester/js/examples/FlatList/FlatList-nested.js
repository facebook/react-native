/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
} from 'react-native';

import type {
  RenderItemProps,
  AccessibilityCollectionItem,
} from 'react-native/Libraries/Lists/VirtualizedListProps';

const DATA = [
  'First Item',
  'Second Item',
  'Third Item',
  'Fourth Item',
  'Fifth Item',
  'Sixth Item',
  'Seven Item',
  'Eight Item',
  'Nine Item',
  'Ten Item',
];

const Item = ({
  item,
  accessibilityCollectionItem,
}: {
  item: string,
  accessibilityCollectionItem: AccessibilityCollectionItem,
  ...
}) => (
  <View
    importantForAccessibility="yes"
    accessibilityCollectionItem={accessibilityCollectionItem}
    style={styles.item}>
    <Text style={styles.title}>{item}</Text>
  </View>
);

const renderItem = ({
  item,
  separators,
  accessibilityCollectionItem,
}: RenderItemProps<string>) => (
  <Item item={item} accessibilityCollectionItem={accessibilityCollectionItem} />
);

const renderFlatList = ({item}: RenderItemProps<number>) => {
  return (
    <View>
      <Text>Flatlist {item}</Text>
      <FlatList renderItem={renderItem} horizontal data={DATA} />
    </View>
  );
};

const FlatListNested = (): React.Node => {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[1, 2, 3]}
        renderItem={renderFlatList}
        keyExtractor={item => item.toString()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
  },
});

exports.title = 'FlatList Nested';
exports.testTitle = 'Test accessibility announcement in nested flatlist';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/flatlist';
exports.description = 'Nested flatlist example';
exports.examples = [
  {
    title: 'FlatList Nested example',
    render: function (): React.Element<typeof FlatListNested> {
      return <FlatListNested />;
    },
  },
];
