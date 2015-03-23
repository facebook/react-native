/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ImageCapInsetsExample
 */
'use strict';

var React = require('react-native');
var {
  Image,
  StyleSheet,
  Text,
  View,
} = React;

var ImageCapInsetsExample = React.createClass({
  render: function() {
    return (
      <View>
        <View style={styles.background}>
          <Text>
            capInsets: none
          </Text>
          <Image
            source={require('image!story-background')}
            style={styles.storyBackground}
            capInsets={{left: 0, right: 0, bottom: 0, top: 0}}
          />
        </View>
        <View style={[styles.background, {paddingTop: 10}]}>
          <Text>
            capInsets: 15
          </Text>
          <Image
            source={require('image!story-background')}
            style={styles.storyBackground}
            capInsets={{left: 15, right: 15, bottom: 15, top: 15}}
          />
        </View>
      </View>
    );
  }
});

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
    resizeMode: Image.resizeMode.stretch,
  },
  text: {
    fontSize: 13.5,
  }
});

module.exports = ImageCapInsetsExample;
