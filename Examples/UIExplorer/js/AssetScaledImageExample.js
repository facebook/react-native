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
 * @flow
 * @providesModule AssetScaledImageExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Image,
  StyleSheet,
  View,
  ScrollView
} = ReactNative;

class AssetScaledImageExample extends React.Component {
  state = {
    asset: this.props.asset
  };

  render() {
    var image = this.state.asset.node.image;
    return (
      <ScrollView>
        <View style={styles.row}>
          <Image source={image} style={styles.imageWide}/>
        </View>
        <View style={styles.row}>
          <Image source={image} style={styles.imageThumb}/>
          <Image source={image} style={styles.imageThumb}/>
          <Image source={image} style={styles.imageThumb}/>
        </View>
        <View style={styles.row}>
          <Image source={image} style={styles.imageT1}/>
          <Image source={image} style={styles.imageT2}/>
        </View>
      </ScrollView>
    );
  }
}

var styles = StyleSheet.create({
  row: {
    padding: 5,
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  textColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  imageWide: {
    borderWidth: 1,
    borderColor: 'black',
    width: 320,
    height: 240,
    margin: 5,
  },
  imageThumb: {
    borderWidth: 1,
    borderColor: 'black',
    width: 100,
    height: 100,
    margin: 5,
  },
  imageT1: {
    borderWidth: 1,
    borderColor: 'black',
    width: 212,
    height: 320,
    margin: 5,
  },
  imageT2: {
    borderWidth: 1,
    borderColor: 'black',
    width: 100,
    height: 320,
    margin: 5,
  },
});

exports.title = '<AssetScaledImageExample>';
exports.description = 'Example component that displays the automatic scaling capabilities of the <Image /> tag';
module.exports = AssetScaledImageExample;
