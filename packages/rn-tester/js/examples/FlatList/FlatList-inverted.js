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
import {useState} from 'react';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  Button,
  Platform,
} from 'react-native';

const DATA = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
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
    id: '58694a0f-3da1-471f-bd96-1155h1429234',
    title: 'Ten Item',
  },
];

function Item({title}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Text
      onPress={() => setPressed(pressed => !pressed)}
      style={[styles.item, styles.title]}>
      {title}
      {` ${pressed ? 'pressed' : ''}`}
    </Text>
  );
}

const renderItem = ({item}) => <Item title={item.title} />;
const ITEM_HEIGHT = 50;

const renderFlatList = ({item}) => <NestedFlatList item={item} />;

const NEW_ITEMS = [
  {title: '11 Item'},
  {title: '12 Item'},
  {title: '13 Item'},
  {title: '14 Item'},
  {title: '15 Item'},
  {title: '16 Item'},
  {title: '17 Item'},
  {title: '18 Item'},
];
function NestedFlatList(props) {
  const [items, setItems] = useState(DATA);
  const [disabled, setDisabled] = useState(false);
  const [index, setIndex] = useState(DATA.length + 1);
  const [counter, setCounter] = useState(0);
  const [offsetFromBottom, setOffsetFromBottom] = useState(null);
  const [contentHeight, setContentHeight] = useState(null);
  let lastOffsetFromTheBottom = React.useRef(null);
  // const [contentHeight, setContentHeight] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  let _hasTriggeredInitialScrollToIndex = React.useRef(null);
  let sentEndForContentLength = React.useRef(null);
  const getNewItems = startIndex => {
    let newItems = [];
    for (let i = startIndex; i < startIndex + 3; i++) {
      newItems.push({title: `${i} Item`});
    }
    return newItems;
  };
  let flatlist = React.useRef(null);
  let _offsetFromBottomOfScreen;
  let _sentEndForContentLength;
  // set listener to disable/enabled depending on screenreader
  const TALKBACK_ENABLED = true;
  let _lastTimeOnEndReachedCalled = React.useRef(null);
  return (
    <View style={{flex: 1}}>
      <Button
        title="add an item"
        onPress={() => {
          setItems([...items, {title: `new item ${index}`}]);
          setIndex(index + 1);
        }}
      />
      <Button
        title="prepend an item"
        onPress={() => {
          setItems([{title: `new item ${index}`}, ...items]);
          setIndex(index + 1);
        }}
      />
      <Button
        title="remove an item"
        onPress={() => {
          const newItems = [...items];
          newItems.splice(items.length - 1, 1);
          setItems(newItems);
        }}
      />
      <Button
        title={`scroll to index of value: ${counter}`}
        onPress={() => {
          // $FlowFixMe
          if (flatlist) flatlist.scrollToIndex({index: counter});
        }}
      />
      <Button
        title="increase index"
        onPress={() => {
          if (flatlist) flatlist.scrollToOffset({offset: 0, animated: false});
        }}
      />
      <Text>Flatlist</Text>
      <FlatList
        ref={ref => {
          flatlist = ref;
        }}
        onContentSizeChange={(width, height) => {
          if (contentHeight == null) {
            setContentHeight(height);
          }
          if (
            flatlist &&
            TALKBACK_ENABLED &&
            _hasTriggeredInitialScrollToIndex.current &&
            !!lastOffsetFromTheBottom.current
          ) {
            const newBottomHeight = height - lastOffsetFromTheBottom.current;
            _hasTriggeredInitialScrollToIndex.current = false;
            setTimeout(
              (flatlist, newBottomHeight) => {
                flatlist.scrollToOffset({
                  offset: newBottomHeight,
                  animated: false,
                });
              },
              1,
              flatlist,
              newBottomHeight,
            );
          }
        }}
        onScroll={event => {
          const {contentSize, contentOffset, contentInset, layoutMeasurement} =
            event.nativeEvent;
          if (flatlist && TALKBACK_ENABLED) {
            const {offset, contentLength, visibleLength} =
              flatlist._listRef._getScrollMetrics();
            const canTriggerOnEndReachedWithTalkback =
              typeof _lastTimeOnEndReachedCalled.current === 'number'
                ? Math.abs(_lastTimeOnEndReachedCalled.current - Date.now()) >
                  500
                : true;
            const distanceFromEnd = offset;
            _offsetFromBottomOfScreen = contentLength - offset;
            if (
              distanceFromEnd < 0.5 &&
              _hasTriggeredInitialScrollToIndex.current &&
              contentLength !== sentEndForContentLength.current &&
              canTriggerOnEndReachedWithTalkback
            ) {
              console.log('------------->');
              console.log('onEndReached');
              _sentEndForContentLength = contentLength;
              // wait 100 ms to call again onEndReached (TalkBack scrolling is slower)
              _lastTimeOnEndReachedCalled.current = Date.now();
              sentEndForContentLength.current = contentLength;
              setItems(items => [...items, ...getNewItems(index)]);
              setIndex(index => index + 3);
              lastOffsetFromTheBottom.current = _offsetFromBottomOfScreen;
            }
            _hasTriggeredInitialScrollToIndex.current = true;
          }
        }}
        enabledTalkbackCompatibleInvertedList
        accessibilityRole="list"
        inverted
        // contentOffset does not work when the offset does not change
        contentOffset={contentHeight != null ? {y: contentHeight, x: 0} : null}
        renderItem={renderItem}
        data={items}
      />
    </View>
  );
}

const FlatList_nested = (): React.Node => {
  return <NestedFlatList />;
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
  title: 'Inverted (Talkback)',
  name: 'inverted (Talkback)',
  description: 'Test inverted prop on FlatList',
  render: () => <FlatList_nested />,
}: RNTesterModuleExample);
