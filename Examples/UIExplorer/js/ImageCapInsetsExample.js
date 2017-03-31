/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @providesModule ImageCapInsetsExample
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');

var nativeImageSource = require('nativeImageSource');
var {
  Image,
  StyleSheet,
  Text,
  View,
} = ReactNative;

class ImageCapInsetsExample extends React.Component {
  render() {
    return (
      <View>
        <View style={styles.background}>
          <Text>
            capInsets: none
          </Text>
          <Image
            source={nativeImageSource({
              ios: 'story-background',
              width: 60,
              height: 60
            })}
            style={styles.storyBackground}
            resizeMode={Image.resizeMode.stretch}
            capInsets={{left: 0, right: 0, bottom: 0, top: 0}}
          />
        </View>
        <View style={[styles.background, {paddingTop: 10}]}>
          <Text>
            capInsets: 15
          </Text>
          <Image
            source={nativeImageSource({
              ios: 'story-background',
              width: 60,
              height: 60
            })}
            style={styles.storyBackground}
            resizeMode={Image.resizeMode.stretch}
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
  }
});

module.exports = ImageCapInsetsExample;
