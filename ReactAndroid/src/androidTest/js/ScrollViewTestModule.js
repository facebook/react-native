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

const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');
const React = require('react');

const {
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} = require('react-native');

const {ScrollListener} = NativeModules;

const NUM_ITEMS = 100;

import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes';

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
  /* $FlowFixMe(>=0.87.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.87 was deployed. To see the error, delete this comment
   * and run Flow. */
  scrollView: {|current: any | null|} = React.createRef();
  state: State = getInitialState();

  scrollTo(destX: number, destY: number) {
    const scrollView = this.scrollView.current;
    if (scrollView == null) {
      return;
    }

    scrollView.scrollTo(destY, destX);
  }

  render(): React.Node {
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
  /* $FlowFixMe(>=0.87.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.87 was deployed. To see the error, delete this comment
   * and run Flow. */
  scrollView: {|current: any | null|} = React.createRef();
  state: State = getInitialState();

  scrollTo(destX: number, destY: number) {
    const scrollView = this.scrollView.current;
    if (scrollView == null) {
      return;
    }

    scrollView.scrollTo(destY, destX);
  }

  render(): React.Node {
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
