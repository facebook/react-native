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

export function FlatList_inverted(): React.Node {
  const [flatlistHeight, setFlatlistHeight] = React.useState(null);
  const [contentHeight, setContentHeight] = React.useState(null);
  const renderItem = ({item}) => {
    return (
      <View style={{backgroundColor: 'yellow', height: 50}}>
        <Text>{item.title}</Text>
      </View>
    );
  };
  const diff = flatlistHeight - contentHeight;
  let contentContainerStyle = null;
  if (diff > 0) {
    contentContainerStyle = {position: 'relative', top: diff};
  }
  return (
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
      data={DATA_SHORT}
      contentContainerStyle={contentContainerStyle}
    />
  );
}

export default ({
  title: 'Inverted',
  name: 'inverted',
  description: 'Test inverted prop on FlatList',
  render: () => <FlatList_inverted />,
}: RNTesterModuleExample);
