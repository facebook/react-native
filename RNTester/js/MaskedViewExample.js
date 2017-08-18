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
  Animated,
  Image,
  MaskedViewIOS,
  StyleSheet,
  Text,
  View,
} = require('react-native');

class MaskedViewExample extends React.Component<{}, $FlowFixMeState> {
  static title = '<MaskedViewIOS>';
  static description = 'Renders the child view with a mask specified in the `renderMask` prop.';

  state = {
    alternateChildren: true,
  };

  _maskRotateAnimatedValue = new Animated.Value(0);
  _maskScaleAnimatedValue = new Animated.Value(1);

  componentDidMount() {
    setInterval(() => {
      this.setState(state => ({
        alternateChildren: !state.alternateChildren,
      }));
    }, 1000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(this._maskScaleAnimatedValue, {
          toValue: 1.3,
          timing: 750,
          useNativeDriver: true,
        }),
        Animated.timing(this._maskScaleAnimatedValue, {
          toValue: 1,
          timing: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(this._maskRotateAnimatedValue, {
        toValue: 360,
        timing: 2000,
        useNativeDriver: true,
      })
    ).start();
  }

  render() {
    return (
      <RNTesterPage title="<MaskedViewIOS>">
        <RNTesterBlock title="Basic Mask">
          <View style={{ width: 300, height: 300, alignSelf: 'center' }}>
            <MaskedViewIOS
              style={{ flex: 1 }}
              maskElement={
                <View style={styles.maskContainerStyle}>
                  <Text style={styles.maskTextStyle}>
                    Basic Mask
                  </Text>
                </View>
              }>
              <View style={{ flex: 1, backgroundColor: 'blue' }} />
              <View style={{ flex: 1, backgroundColor: 'red' }} />
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
              maskElement={
                <View style={styles.maskContainerStyle}>
                  <Image
                    style={{ height: 200, width: 200 }}
                    source={require('./imageMask.png')}
                  />
                </View>
              }>
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
        <RNTesterBlock title="Animated Mask">
          <View style={{ width: 300, height: 300, alignSelf: 'center' }}>
            <MaskedViewIOS
              style={{ flex: 1 }}
              maskElement={
                <Animated.View
                  style={[
                    styles.maskContainerStyle,
                    { transform: [{ scale: this._maskScaleAnimatedValue }] },
                  ]}>
                  <Text style={styles.maskTextStyle}>
                    Basic Mask
                  </Text>
                </Animated.View>
              }>
              <Animated.View
                style={{
                  flex: 1,
                  transform: [
                    {
                      rotate: this._maskRotateAnimatedValue.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}>
                <View style={{ flex: 1, backgroundColor: 'blue' }} />
                <View style={{ flex: 1, backgroundColor: 'red' }} />
              </Animated.View>
            </MaskedViewIOS>
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="Mask w/ Changing Children">
          <View style={{ width: 300, height: 300, alignSelf: 'center' }}>
            <MaskedViewIOS
              style={{ flex: 1 }}
              maskElement={
                <View style={styles.maskContainerStyle}>
                  <Text style={styles.maskTextStyle}>
                    Basic Mask
                  </Text>
                </View>
              }>
              {this.state.alternateChildren
                ? [
                    <View
                      key={1}
                      style={{ flex: 1, backgroundColor: 'blue' }}
                    />,
                    <View
                      key={2}
                      style={{ flex: 1, backgroundColor: 'red' }}
                    />,
                  ]
                : null}
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
