/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ScrollViewExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} = ReactNative;

exports.displayName = 'ScrollViewExample';
exports.title = '<ScrollView>';
exports.description = 'Component that enables scrolling through child components';
exports.examples = [
{
  title: '<ScrollView>',
  description: 'To make content scrollable, wrap it within a <ScrollView> component',
  render: function() {
    var _scrollView: ScrollView;
    return (
      <View>
        <ScrollView
          ref={(scrollView) => { _scrollView = scrollView; }}
          automaticallyAdjustContentInsets={false}
          onScroll={() => { console.log('onScroll!'); }}
          scrollEventThrottle={200}
          style={styles.scrollView}>
          {THUMB_URLS.map(createThumbRow)}
        </ScrollView>
        <TouchableOpacity
          style={styles.button}
          onPress={() => { _scrollView.scrollTo({y: 0}); }}>
          <Text>Scroll to top</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => { _scrollView.scrollToEnd({animated: true}); }}>
          <Text>Scroll to bottom</Text>
        </TouchableOpacity>
        { Platform.OS === 'ios' ?
          <TouchableOpacity
            style={styles.button}
            onPress={() => { _scrollView.flashScrollIndicators(); }}>
            <Text>Flash scroll indicators</Text>
          </TouchableOpacity>
          : null }
      </View>
    );
  }
}, {
  title: '<ScrollView> (horizontal = true)',
  description: 'You can display <ScrollView>\'s child components horizontally rather than vertically',
  render: function() {

    function renderScrollView(title: string, addtionalStyles: typeof StyleSheet) {
      var _scrollView: ScrollView;
      return (
        <View style={addtionalStyles}>
          <Text style={styles.text}>{title}</Text>
          <ScrollView
            ref={(scrollView) => { _scrollView = scrollView; }}
            automaticallyAdjustContentInsets={false}
            horizontal={true}
            style={[styles.scrollView, styles.horizontalScrollView]}>
            {THUMB_URLS.map(createThumbRow)}
          </ScrollView>
          <TouchableOpacity
            style={styles.button}
            onPress={() => { _scrollView.scrollTo({x: 0}); }}>
            <Text>Scroll to start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => { _scrollView.scrollToEnd({animated: true}); }}>
            <Text>Scroll to end</Text>
          </TouchableOpacity>
          { Platform.OS === 'ios' ?
            <TouchableOpacity
              style={styles.button}
              onPress={() => { _scrollView.flashScrollIndicators(); }}>
              <Text>Flash scroll indicators</Text>
            </TouchableOpacity>
            : null }
        </View>
      );
    }

    return (
      <View>
        {renderScrollView('LTR layout', {direction: 'ltr'})}
        {renderScrollView('RTL layout', {direction: 'rtl'})}
      </View>
    );
  }
}];

class Thumb extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }

  render() {
    return (
      <View style={styles.thumb}>
        <Image style={styles.img} source={this.props.source} />
      </View>
    );
  }
}

var THUMB_URLS = [
  require('./Thumbnails/like.png'),
  require('./Thumbnails/dislike.png'),
  require('./Thumbnails/call.png'),
  require('./Thumbnails/fist.png'),
  require('./Thumbnails/bandaged.png'),
  require('./Thumbnails/flowers.png'),
  require('./Thumbnails/heart.png'),
  require('./Thumbnails/liking.png'),
  require('./Thumbnails/party.png'),
  require('./Thumbnails/poke.png'),
  require('./Thumbnails/superlike.png'),
  require('./Thumbnails/victory.png'),
];

THUMB_URLS = THUMB_URLS.concat(THUMB_URLS); // double length of THUMB_URLS

var createThumbRow = (uri, i) => <Thumb key={i} source={uri} />;

var styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300,
  },
  horizontalScrollView: {
    height: 106,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 5,
  },
  button: {
    margin: 5,
    padding: 5,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    borderRadius: 3,
  },
  thumb: {
    margin: 5,
    padding: 5,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
  },
  img: {
    width: 64,
    height: 64,
  }
});
