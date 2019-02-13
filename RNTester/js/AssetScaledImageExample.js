/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {Image, StyleSheet, View, ScrollView} = ReactNative;

import type {PhotoIdentifier} from 'CameraRoll';

type Props = $ReadOnly<{|
  asset: PhotoIdentifier,
|}>;

type State = {|
  asset: PhotoIdentifier,
|};

class AssetScaledImageExample extends React.Component<Props, State> {
  state = {
    asset: this.props.asset,
  };

  render() {
    const image = this.state.asset.node.image;
    return (
      <ScrollView>
        <View style={styles.row}>
          <Image source={image} style={styles.imageWide} />
        </View>
        <View style={styles.row}>
          <Image source={image} style={styles.imageThumb} />
          <Image source={image} style={styles.imageThumb} />
          <Image source={image} style={styles.imageThumb} />
        </View>
        <View style={styles.row}>
          <Image source={image} style={styles.imageT1} />
          <Image source={image} style={styles.imageT2} />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    padding: 5,
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
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
exports.description =
  'Example component that displays the automatic scaling capabilities of the <Image /> tag';
module.exports = AssetScaledImageExample;
