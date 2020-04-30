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

const {
  Animated,
  Image,
  MaskedViewIOS,
  StyleSheet,
  Text,
  View,
} = require('react-native');

type Props = $ReadOnly<{||}>;
type ChangingChildrenState = {|
  alternateChildren: boolean,
|};

class AnimatedMaskExample extends React.Component<Props> {
  _maskRotateAnimatedValue = new Animated.Value(0);
  _maskScaleAnimatedValue = new Animated.Value(1);

  componentDidMount() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this._maskScaleAnimatedValue, {
          toValue: 1.3,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(this._maskScaleAnimatedValue, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(this._maskRotateAnimatedValue, {
        toValue: 360,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();
  }

  render(): React.Node {
    return (
      <View style={styles.exampleWrapperStyle}>
        <MaskedViewIOS
          style={styles.flexStyle}
          maskElement={
            <Animated.View
              style={[
                styles.maskContainerStyle,
                {transform: [{scale: this._maskScaleAnimatedValue}]},
              ]}>
              <Text style={styles.maskTextStyle}>Basic Mask</Text>
            </Animated.View>
          }>
          <Animated.View
            style={{
              flex: 1,
              transform: [
                {
                  rotate: this._maskRotateAnimatedValue.interpolate({
                    inputRange: [0, 360],
                    /* $FlowFixMe(>=0.38.0) - Flow error detected during the
                     * deployment of v0.38.0. To see the error, remove this
                     * comment and run flow */
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}>
            <View style={styles.blueStyle} />
            <View style={styles.redStyle} />
          </Animated.View>
        </MaskedViewIOS>
      </View>
    );
  }
}

class ChangingChildrenMaskExample extends React.Component<
  Props,
  ChangingChildrenState,
> {
  state: ChangingChildrenState = {
    alternateChildren: true,
  };

  componentDidMount() {
    setInterval(() => {
      this.setState(state => ({
        alternateChildren: !state.alternateChildren,
      }));
    }, 1000);
  }

  render(): React.Node {
    return (
      <View style={styles.exampleWrapperStyle}>
        <MaskedViewIOS
          style={styles.flexStyle}
          maskElement={
            <View style={styles.maskContainerStyle}>
              <Text style={styles.maskTextStyle}>Basic Mask</Text>
            </View>
          }>
          {this.state.alternateChildren
            ? [
                <View key={1} style={styles.blueStyle} />,
                <View key={2} style={styles.redStyle} />,
              ]
            : null}
        </MaskedViewIOS>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  exampleWrapperStyle: {
    width: 340,
    height: 300,
    alignSelf: 'center',
  },
  imageStyle: {
    height: 200,
    width: 200,
  },
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
  blueStyle: {
    flex: 1,
    backgroundColor: 'blue',
  },
  redStyle: {
    flex: 1,
    backgroundColor: 'red',
  },
  grayStyle: {
    backgroundColor: '#eeeeee',
  },
  flexStyle: {
    flex: 1,
  },
});

exports.title = '<MaskedViewIOS>';
exports.description =
  'Renders the child view with a mask specified in the `renderMask` prop.';
exports.examples = [
  {
    title: 'Basic Mask',
    render: function(): React.Element<typeof View> {
      return (
        <View style={styles.exampleWrapperStyle}>
          <MaskedViewIOS
            style={styles.flexStyle}
            maskElement={
              <View style={styles.maskContainerStyle}>
                <Text style={styles.maskTextStyle}>Basic Mask</Text>
              </View>
            }>
            <View style={styles.blueStyle} />
            <View style={styles.redStyle} />
          </MaskedViewIOS>
        </View>
      );
    },
  },
  {
    title: 'Image Mask',
    render: function(): React.Element<typeof View> {
      return (
        <View style={[styles.exampleWrapperStyle, styles.grayStyle]}>
          <MaskedViewIOS
            style={styles.flexStyle}
            maskElement={
              <View style={styles.maskContainerStyle}>
                <Image
                  style={styles.imageStyle}
                  source={require('../../assets/imageMask.png')}
                />
              </View>
            }>
            <View style={styles.maskContainerStyle}>
              <Image
                resizeMode="cover"
                style={styles.imageStyle}
                source={{
                  uri:
                    'https://38.media.tumblr.com/9e9bd08c6e2d10561dd1fb4197df4c4e/tumblr_mfqekpMktw1rn90umo1_500.gif',
                }}
              />
            </View>
          </MaskedViewIOS>
        </View>
      );
    },
  },
  {
    title: 'Animated Mask',
    render: function(): React.Element<typeof AnimatedMaskExample> {
      return <AnimatedMaskExample />;
    },
  },
  {
    title: 'Mask w/ Changing Children',
    render: function(): React.Element<typeof ChangingChildrenMaskExample> {
      return <ChangingChildrenMaskExample />;
    },
  },
];
