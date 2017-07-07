/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule MaskedViewExample
 */
'use strict';

const React = require('react');
const RNTesterBlock = require('RNTesterBlock');
const RNTesterPage = require('RNTesterPage');
const {
  Image,
  MaskedViewIOS,
  StyleSheet,
  Text,
  View,
} = require('react-native');

class MaskedViewExample extends React.Component {
  static title = '<MaskedViewIOS>';
  static description = 'Renders the child view with a mask specified in the `renderMask` prop.';

  render() {
    return (
      <RNTesterPage title="<MaskedViewIOS>">
        <RNTesterBlock title="Basic Mask">
          <View style={{ width: 300, height: 300, alignSelf: 'center' }}>
            <MaskedViewIOS
              style={{ flex: 1 }}
              renderMask={() =>
                <View style={styles.maskContainerStyle}>
                  <Text style={styles.maskTextStyle}>
                    Basic Mask
                  </Text>
                </View>}>
              <View style={{ flex: 1, backgroundColor: 'blue' }} />
            </MaskedViewIOS>
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="Image Mask">
          <View
            style={{
              width: 300,
              height: 300,
              alignSelf: 'center',
              backgroundColor: '#eeeeee',
            }}>
            <MaskedViewIOS
              style={{ flex: 1 }}
              renderMask={() =>
                <View style={styles.maskContainerStyle}>
                  <Image
                    style={{ height: 200, width: 200 }}
                    source={require('./imageMask.png')}
                  />
                </View>}>
              <View style={styles.maskContainerStyle}>
                <Image
                  resizeMode="cover"
                  style={{ width: 200, height: 200 }}
                  source={{
                    uri:
                      'https://38.media.tumblr.com/9e9bd08c6e2d10561dd1fb4197df4c4e/tumblr_mfqekpMktw1rn90umo1_500.gif',
                  }}
                />
              </View>
            </MaskedViewIOS>
          </View>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  maskContainerStyle: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskTextStyle: {
    backgroundColor: 'transparent',
    fontSize: 40,
    fontWeight: 'bold',
  },
});

module.exports = MaskedViewExample;
