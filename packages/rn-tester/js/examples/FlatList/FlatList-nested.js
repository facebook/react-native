/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  Button,
} from 'react-native';

const DATA = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28b7',
    title: 'First Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'Second Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29d72',
    title: 'Third Item',
  },
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb8bbb',
    title: 'Fourth Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97676',
    title: 'Fifth Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e27234',
    title: 'Sixth Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29234',
    title: 'Seven Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571429234',
    title: 'Eight Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-115571429234',
    title: 'Nine Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-1155h1429235',
    title: 'Ten Item',
  },
];

const Item = ({title}) => (
  <Text style={[styles.item, styles.title]}>{title}</Text>
);

const renderItem = ({item}) => <Item title={item.title} />;
const ITEM_HEIGHT = 50;

const renderFlatList = ({item}) => <NestedFlatList item={item} />;

function NestedFlatList(props) {
  const [items, setItems] = React.useState(DATA);
  return (
    <View>
      <Button
        title="add an item"
        onPress={() => setItems(items => [...items, {title: 'new item'}])}
      />
      <Button
        title="remove an item"
        onPress={() => {
          const newItems = [...items];
          newItems.splice(items.length - 1, 1);
          setItems(newItems);
        }}
      />
      <Text>Flatlist</Text>
      <FlatList
        enabledTalkbackCompatibleInvertedList
        style={{height: 400}}
        inverted
        renderItem={renderItem}
        data={items}
      />
    </View>
  );
}

const FlatList_nested = (): React.Node => {
  return (
    <FlatList
      data={[1, 2, 3]}
      horizontal
      renderItem={renderFlatList}
      keyExtractor={item => item.toString()}
    />
  );
};

const styles = StyleSheet.create({
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

export default ({
  title: 'Nested (TalkBack)',
  name: 'nested (TalkBack)',
  description: 'nested FlatList',
  render: () => <FlatList_nested />,
}: RNTesterModuleExample);
