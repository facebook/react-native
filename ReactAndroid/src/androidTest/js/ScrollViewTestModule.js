/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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

// Shared by integration tests for ScrollView and HorizontalScrollView

let scrollViewApp;

class Item extends React.Component {
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

class ScrollViewTestApp extends React.Component {
  constructor() {
    super();
    this.scrollView = React.createRef();
  }

  getInitialState = () => {
    var data = [];
    for (var i = 0; i < NUM_ITEMS; i++) {
      data[i] = {text: 'Item ' + i + '!'};
    }
    return {
      data: data,
    };
  };

  onScroll = e => {
    ScrollListener.onScroll(
      e.nativeEvent.contentOffset.x,
      e.nativeEvent.contentOffset.y,
    );
  };

  onItemPress = itemNumber => {
    ScrollListener.onItemPress(itemNumber);
  };

  onScrollBeginDrag = e => {
    ScrollListener.onScrollBeginDrag(
      e.nativeEvent.contentOffset.x,
      e.nativeEvent.contentOffset.y,
    );
  };

  onScrollEndDrag = e => {
    ScrollListener.onScrollEndDrag(
      e.nativeEvent.contentOffset.x,
      e.nativeEvent.contentOffset.y,
    );
  };

  scrollTo = (destX, destY) => {
    this.scrollView.scrollTo(destY, destX);
  };

  render() {
    scrollViewApp = this;
    var children = this.state.data.map((item, index) => (
      <Item
        key={index}
        text={item.text}
        onPress={this.onItemPress.bind(this, index)}
      />
    ));
    return (
      <ScrollView
        onScroll={this.onScroll}
        onScrollBeginDrag={this.onScrollBeginDrag}
        onScrollEndDrag={this.onScrollEndDrag}
        ref={this.scrollView}>
        {children}
      </ScrollView>
    );
  }
}

class HorizontalScrollViewTestApp extends React.Component {
  constructor() {
    super();
    this.scrollView = React.createRef();
  }

  getInitialState = () => {
    var data = [];
    for (var i = 0; i < NUM_ITEMS; i++) {
      data[i] = {text: 'Item ' + i + '!'};
    }
    return {
      data: data,
    };
  };

  onScroll = e => {
    ScrollListener.onScroll(
      e.nativeEvent.contentOffset.x,
      e.nativeEvent.contentOffset.y,
    );
  };

  onItemPress = itemNumber => {
    ScrollListener.onItemPress(itemNumber);
  };

  scrollTo = (destX, destY) => {
    this.scrollView.scrollTo(destY, destX);
  };

  render() {
    scrollViewApp = this;
    var children = this.state.data.map((item, index) => (
      <Item
        key={index}
        text={item.text}
        onPress={this.onItemPress.bind(this, index)}
      />
    ));
    return (
      <ScrollView
        horizontal={true}
        onScroll={this.onScroll}
        ref={this.scrollView}>
        {children}
      </ScrollView>
    );
  }
}

var styles = StyleSheet.create({
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

var ScrollViewTestModule = {
  ScrollViewTestApp: ScrollViewTestApp,
  HorizontalScrollViewTestApp: HorizontalScrollViewTestApp,
  scrollTo: function(destX, destY) {
    scrollViewApp.scrollTo(destX, destY);
  },
};

BatchedBridge.registerCallableModule(
  'ScrollViewTestModule',
  ScrollViewTestModule,
);

module.exports = ScrollViewTestModule;
