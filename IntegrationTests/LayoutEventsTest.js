/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LayoutEventsTest
 * @flow
 */
'use strict';

var React = require('react');
var createReactClass = require('create-react-class');
var ReactNative = require('react-native');
var {
  Image,
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

var deepDiffer = require('deepDiffer');

function debug(...args) {
  // console.log.apply(null, arguments);
}

import type {Layout, LayoutEvent} from 'CoreEventTypes';
type Style = {
  margin?: number,
  padding?: number,
  borderColor?: string,
  borderWidth?: number,
  backgroundColor?: string,
  width?: number,
};

type State = {
  didAnimation: boolean,
  extraText?: string,
  imageLayout?: Layout,
  textLayout?: Layout,
  viewLayout?: Layout,
  viewStyle?: Style,
  containerStyle?: Style,
};

var LayoutEventsTest = createReactClass({
  displayName: 'LayoutEventsTest',
  getInitialState(): State {
    return {
      didAnimation: false,
    };
  },
  animateViewLayout: function() {
    debug('animateViewLayout invoked');
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.spring,
      () => {
        debug('animateViewLayout done');
        this.checkLayout(this.addWrapText);
      }
    );
    this.setState({viewStyle: {margin: 60}});
  },
  addWrapText: function() {
    debug('addWrapText invoked');
    this.setState(
      {extraText: '  And a bunch more text to wrap around a few lines.'},
      () => this.checkLayout(this.changeContainer)
    );
  },
  changeContainer: function() {
    debug('changeContainer invoked');
    this.setState(
      {containerStyle: {width: 280}},
      () => this.checkLayout(TestModule.markTestCompleted)
    );
  },
  checkLayout: function(next?: ?Function) {
    if (!this.isMounted()) {
      return;
    }
    this.refs.view.measure((x, y, width, height) => {
      this.compare('view', {x, y, width, height}, this.state.viewLayout);
      if (typeof next === 'function') {
        next();
      } else if (!this.state.didAnimation) {
        // Trigger first state change after onLayout fires
        this.animateViewLayout();
        this.state.didAnimation = true;
      }
    });
    this.refs.txt.measure((x, y, width, height) => {
      this.compare('txt', {x, y, width, height}, this.state.textLayout);
    });
    this.refs.img.measure((x, y, width, height) => {
      this.compare('img', {x, y, width, height}, this.state.imageLayout);
    });
  },
  compare: function(node: string, measured: any, onLayout: any): void {
    if (deepDiffer(measured, onLayout)) {
      var data = {measured, onLayout};
      throw new Error(
        node + ' onLayout mismatch with measure ' +
          JSON.stringify(data, null, '  ')
      );
    }
  },
  onViewLayout: function(e: LayoutEvent) {
    debug('received view layout event\n', e.nativeEvent);
    this.setState({viewLayout: e.nativeEvent.layout}, this.checkLayout);
  },
  onTextLayout: function(e: LayoutEvent) {
    debug('received text layout event\n', e.nativeEvent);
    this.setState({textLayout: e.nativeEvent.layout}, this.checkLayout);
  },
  onImageLayout: function(e: LayoutEvent) {
    debug('received image layout event\n', e.nativeEvent);
    this.setState({imageLayout: e.nativeEvent.layout}, this.checkLayout);
  },
  render: function() {
    var viewStyle = [styles.view, this.state.viewStyle];
    var textLayout = this.state.textLayout || {width: '?', height: '?'};
    var imageLayout = this.state.imageLayout || {x: '?', y: '?'};
    debug('viewLayout', this.state.viewLayout);
    return (
      <View style={[styles.container, this.state.containerStyle]}>
        <View ref="view" onLayout={this.onViewLayout} style={viewStyle}>
          <Image
            ref="img"
            onLayout={this.onImageLayout}
            style={styles.image}
            source={{uri: 'uie_thumb_big.png'}}
          />
          <Text ref="txt" onLayout={this.onTextLayout} style={styles.text}>
            A simple piece of text.{this.state.extraText}
          </Text>
          <Text>
            {'\n'}
            Text w/h: {textLayout.width}/{textLayout.height + '\n'}
            Image x/y: {imageLayout.x}/{imageLayout.y}
          </Text>
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    margin: 40,
  },
  view: {
    margin: 20,
    padding: 12,
    borderColor: 'black',
    borderWidth: 0.5,
    backgroundColor: 'transparent',
  },
  text: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(0, 0, 255, 0.2)',
    borderWidth: 0.5,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
});

LayoutEventsTest.displayName = 'LayoutEventsTest';

module.exports = LayoutEventsTest;
