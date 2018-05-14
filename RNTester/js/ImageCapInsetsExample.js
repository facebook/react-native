/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');

var nativeImageSource = require('nativeImageSource');
var {Image, StyleSheet, Text, View} = ReactNative;

class ImageCapInsetsExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View style={styles.background}>
          <Text>capInsets: none</Text>
          <Image
            source={nativeImageSource({
              ios: 'story-background',
              width: 60,
              height: 60,
            })}
            style={styles.storyBackground}
            resizeMode="stretch"
            capInsets={{left: 0, right: 0, bottom: 0, top: 0}}
          />
        </View>
        <View style={[styles.background, {paddingTop: 10}]}>
          <Text>capInsets: 15</Text>
          <Image
            source={nativeImageSource({
              ios: 'story-background',
              width: 60,
              height: 60,
            })}
            style={styles.storyBackground}
            resizeMode="stretch"
            capInsets={{left: 15, right: 15, bottom: 15, top: 15}}
          />
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  background: {
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontal: {
    flexDirection: 'row',
  },
  storyBackground: {
    width: 250,
    height: 150,
    borderWidth: 1,
  },
  text: {
    fontSize: 13.5,
  },
});

module.exports = ImageCapInsetsExample;
