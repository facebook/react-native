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
  View,
  FlatList,
  StyleSheet,
  Text,
  Button,
  Platform,
  AccessibilityInfo,
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
      onPress={() => setPressed(status => !status)}
      style={[styles.item, styles.title]}>
      {title}
      {` ${pressed ? 'pressed' : ''}`}
    </Text>
  );
}

const renderItem = ({item}) => <Item title={item.title} />;

function InvertedFlatlist(props) {
  const [items, setItems] = useState(DATA);
  const [index, setIndex] = useState(DATA.length + 1);
  const [counter, setCounter] = useState(0);
  const [contentHeight, setContentHeight] = useState(null);
  const [screenreaderEnabled, setScreenreaderEnabled] = useState(undefined);
  let lastOffsetFromTheBottom = React.useRef(null);
  let _hasTriggeredInitialScrollToIndex = React.useRef(null);
  let _addedNewItems = React.useRef(null);
  let sentEndForContentLength = React.useRef(null);
  let flatlist = React.useRef(null);
  let _lastTimeOnEndReachedCalled = React.useRef(null);
  let _offsetFromBottomOfScreen;
  let _screenreaderEventListener;
  const getNewItems = startIndex => {
    let newItems = [];
    for (let i = startIndex; i < startIndex + 3; i++) {
      newItems.push({title: `${i} Item`});
    }
    return newItems;
  };
  // set listener to disable/enabled depending on screenreader
  if (Platform.OS === 'android') {
    _screenreaderEventListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      status => {
        if (typeof status === 'boolean' && status !== screenreaderEnabled) {
          setScreenreaderEnabled(status);
        }
      },
    );
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    // updates the initial state of the screenreaderReader
    if (Platform.OS === 'android' && screenreaderEnabled === undefined) {
      AccessibilityInfo.isScreenReaderEnabled().then(
        status => {
          if (typeof status === 'boolean' && status !== screenreaderEnabled) {
            setScreenreaderEnabled(status);
          }
        },
        e => {
          if (__DEV__) {
            console.log(
              'isScreenReaderEnabled() raised an error, in this case the default inverted FlatList will be used with Talkback. ' +
                e.toString(),
            );
          }
        },
      );
    }

    return () => {
      if (_screenreaderEventListener) {
        _screenreaderEventListener.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
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
          if (flatlist) {
            // $FlowFixMe
            flatlist.scrollToIndex({index: counter});
          }
        }}
      />
      <Button
        title="increase index"
        onPress={() => {
          setCounter(currentCount => currentCount + 1);
        }}
      />
      <Text>Flatlist</Text>
      <FlatList
        ref={ref => {
          // $FlowFixMe
          flatlist = ref;
        }}
        onContentSizeChange={(width, height) => {
          if (contentHeight == null) {
            setContentHeight(height);
          }
          if (
            flatlist &&
            screenreaderEnabled === true &&
            _hasTriggeredInitialScrollToIndex.current === true &&
            lastOffsetFromTheBottom.current != null &&
            _addedNewItems.current === true
          ) {
            const newBottomHeight = height - lastOffsetFromTheBottom.current;
            _hasTriggeredInitialScrollToIndex.current = false;
            // $FlowFixMe
            flatlist.scrollToOffset({
              offset: newBottomHeight,
              animated: false,
            });
            _hasTriggeredInitialScrollToIndex.current = true;
            _addedNewItems.current = false;
          }
        }}
        onScroll={event => {
          if (flatlist && screenreaderEnabled === true) {
            const {offset, contentLength} =
              // $FlowFixMe
              flatlist._listRef._getScrollMetrics();
            const canTriggerOnEndReachedWithTalkback =
              typeof _lastTimeOnEndReachedCalled.current === 'number'
                ? Math.abs(_lastTimeOnEndReachedCalled.current - Date.now()) >
                  500
                : true;
            const distanceFromEnd = offset;
            _offsetFromBottomOfScreen = contentLength - offset;
            if (
              distanceFromEnd < 20 &&
              _hasTriggeredInitialScrollToIndex.current === true &&
              contentLength !== sentEndForContentLength.current &&
              canTriggerOnEndReachedWithTalkback
            ) {
              console.log('------------->');
              console.log('onEndReached');
              // wait 100 ms to call again onEndReached (TalkBack scrolling is slower)
              _lastTimeOnEndReachedCalled.current = Date.now();
              sentEndForContentLength.current = contentLength;
              setItems(previousItems => [
                ...previousItems,
                ...getNewItems(index),
              ]);
              setIndex(currentIndex => currentIndex + 3);
              lastOffsetFromTheBottom.current = _offsetFromBottomOfScreen;
              _addedNewItems.current = true;
            }
            _hasTriggeredInitialScrollToIndex.current = true;
          }
        }}
        inverted
        enabledTalkbackCompatibleInvertedList
        renderItem={renderItem}
        data={items}
        accessibilityRole="list"
      />
    </View>
  );
}

const FlatList_inverted = (): React.Node => {
  return <InvertedFlatlist />;
};

const styles = StyleSheet.create({
  container: {flex: 1},
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
  render: () => <FlatList_inverted />,
}: RNTesterModuleExample);
