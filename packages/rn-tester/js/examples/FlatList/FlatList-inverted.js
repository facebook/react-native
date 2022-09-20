/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import BaseFlatListExample from './BaseFlatListExample';
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Button,
} from 'react-native';
import * as React from 'react';

const DATA_SHORT = [
  {title: 'first item'},
  {title: 'second item'},
  {title: 'third item'},
];

const DATA_LONG = [
  {title: 'first item'},
  {title: 'second item'},
  {title: 'third item'},
  {title: 'fourth item'},
  {title: 'sixth item'},
  {title: 'eight item'},
  {title: 'ninth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'tenth item'},
  {title: 'before last item'},
  {title: 'last item'},
];

// For this example we mock this value
// Test the example with talkback enabled, otherwise se this value to false
const TALKBACK_ENABLED = true;

export function FlatList_inverted(): React.Node {
  const [flatlistHeight, setFlatlistHeight] = React.useState(null);
  const [contentHeight, setContentHeight] = React.useState(null);
  const [items, setItems] = React.useState(DATA_LONG);
  const renderItem = ({item}) => {
    return (
      <View style={{backgroundColor: 'yellow', height: 50}}>
        <Text>{item.title}</Text>
      </View>
    );
  };
  let flatlistStyle = {};
  if (flatlistHeight !== null && contentHeight !== null && TALKBACK_ENABLED) {
    const diff = flatlistHeight - contentHeight;
    if (diff > 0) {
      // flatlistStyle = {position: 'relative', top: diff};
      flatlistStyle = {flexDirection: 'column-reverse'};
    }
  }
  return (
    <>
      <Button
        onPress={() => setItems(items => [...items, {title: 'new item'}])}
        title="append an item"
      />
      <Button
        onPress={() => setItems(items => items.slice(0, -1))}
        title="remove item"
      />
      <Button
        title="prepend an item"
        onPress={() => {
          setItems([{title: `new item`}, ...items]);
        }}
      />
      <FlatList
        onLayout={event => {
          const height = event.nativeEvent.layout.height;
          setFlatlistHeight(height);
        }}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
        inverted
        enabledTalkbackCompatibleInvertedList={true}
        renderItem={renderItem}
        data={items}
        onEndReached={() => console.log('onEndReached')}
        // style={flatlistStyle}
        // contentContainerStyle={styles.contentContainerStyle}
      />
    </>
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    flexDirection: 'column-reverse',
  },
});

export default ({
  title: 'Inverted',
  name: 'inverted',
  description: 'Test inverted prop on FlatList',
  render: () => <FlatList_inverted />,
}: RNTesterModuleExample);
