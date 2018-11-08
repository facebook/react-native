/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const React = require('React');
const View = require('View');
const ScrollView = require('ScrollView');
const Text = require('Text');
const StyleSheet = require('StyleSheet');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const ScrollListener = require('NativeModules').ScrollListener;

const NUM_ITEMS = 100;

import type {PressEvent} from 'CoreEventTypes';

// Shared by integration tests for ScrollView and HorizontalScrollView

let scrollViewApp;

type ItemProps = $ReadOnly<{|
  onPress: (event: PressEvent) => void,
  text: string,
|}>;

type ItemState = {||};

class Item extends React.Component<ItemProps, ItemState> {
  render() {
    return (
      <TouchableWithoutFeedback onPress={this.props.onPress}>
        <View style={styles.item_container}>
          <Text style={styles.item_text}>{this.props.text}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const getInitialState = function() {
  const data = [];
  for (let i = 0; i < NUM_ITEMS; i++) {
    data[i] = {text: 'Item ' + i + '!'};
  }
  return {
    data: data,
  };
};

const onScroll = function(e) {
  ScrollListener.onScroll(
    e.nativeEvent.contentOffset.x,
    e.nativeEvent.contentOffset.y,
  );
};

const onScrollBeginDrag = function(e) {
  ScrollListener.onScrollBeginDrag(
    e.nativeEvent.contentOffset.x,
    e.nativeEvent.contentOffset.y,
  );
};

const onScrollEndDrag = function(e) {
  ScrollListener.onScrollEndDrag(
    e.nativeEvent.contentOffset.x,
    e.nativeEvent.contentOffset.y,
  );
};

const onItemPress = function(itemNumber) {
  ScrollListener.onItemPress(itemNumber);
};

type Props = $ReadOnly<{||}>;
type State = {|
  data: $ReadOnlyArray<{|text: string|}>,
|};

class ScrollViewTestApp extends React.Component<Props, State> {
  scrollView = React.createRef();
  state = getInitialState();

  scrollTo(destX: number, destY: number) {
    const scrollView = this.scrollView.current;
    if (scrollView == null) {
      return;
    }

    scrollView.scrollTo(destY, destX);
  }

  render() {
    scrollViewApp = this;
    const children = this.state.data.map((item, index) => (
      <Item
        key={index}
        text={item.text}
        onPress={onItemPress.bind(this, index)}
      />
    ));
    return (
      <ScrollView
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        ref={this.scrollView}>
        {children}
      </ScrollView>
    );
  }
}

class HorizontalScrollViewTestApp extends React.Component<Props, State> {
  scrollView = React.createRef();
  state = getInitialState();

  scrollTo(destX: number, destY: number) {
    const scrollView = this.scrollView.current;
    if (scrollView == null) {
      return;
    }

    scrollView.scrollTo(destY, destX);
  }

  render() {
    scrollViewApp = this;
    const children = this.state.data.map((item, index) => (
      <Item
        key={index}
        text={item.text}
        onPress={onItemPress.bind(this, index)}
      />
    ));
    return (
      <ScrollView horizontal={true} onScroll={onScroll} ref={this.scrollView}>
        {children}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  item_container: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  item_text: {
    flex: 1,
    fontSize: 18,
    alignSelf: 'center',
  },
});

const ScrollViewTestModule = {
  ScrollViewTestApp: ScrollViewTestApp,
  HorizontalScrollViewTestApp: HorizontalScrollViewTestApp,
  scrollTo(destX: number, destY: number) {
    scrollViewApp.scrollTo(destX, destY);
  },
};

BatchedBridge.registerCallableModule(
  'ScrollViewTestModule',
  ScrollViewTestModule,
);

module.exports = ScrollViewTestModule;
