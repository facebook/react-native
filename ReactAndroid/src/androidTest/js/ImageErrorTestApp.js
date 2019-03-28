/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('React');
const Image = require('Image');
const StyleSheet = require('StyleSheet');
const View = require('View');

const RecordingModule = require('NativeModules').Recording;

class ImageErrorTestApp extends React.Component {
  onError = e => {
    RecordingModule.record('Got error: ' + e.nativeEvent.error);
  };

  render() {
    // For some reason image-2 needs explicit height. Without it onError is not triggered.
    return (
      <View>
        <Image
          testID="image-1"
          source={{uri: '/does/not/exist'}}
          onError={this.onError}
        />
        <Image
          testID="image-2"
          source={{uri: 'file:///does/not/exist'}}
          style={styles.image}
          onError={this.onError}
        />
        <Image
          testID="image-3"
          source={{
            uri: 'https://TYPO_ERROR_facebook.github.io/react/logo-og.png',
          }}
          onError={this.onError}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  image: {
    height: 50,
    width: 50,
  },
});

module.exports = ImageErrorTestApp;
