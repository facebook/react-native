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

/* eslint-disable react-native/no-inline-styles */

const React = require('react');
const {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} = require('react-native');

exports.title = '<View>';
exports.description =
  'Basic building block of all UI, examples that ' +
  'demonstrate some of the many styles available.';

exports.displayName = 'ViewExample';
exports.examples = [
  {
    title: 'Background Color',
    render() {
      return (
        <View style={{backgroundColor: '#527FE4', padding: 5}}>
          <Text style={{fontSize: 11}}>Blue background</Text>
        </View>
      );
    },
  },
  {
    title: 'Border',
    render() {
      return (
        <View style={{borderColor: '#527FE4', borderWidth: 5, padding: 10}}>
          <Text style={{fontSize: 11}}>5px blue border</Text>
        </View>
      );
    },
  },
  {
    title: 'Padding/Margin',
    render() {
      const styles = StyleSheet.create({
        box: {
          backgroundColor: '#527FE4',
          borderColor: '#000033',
          borderWidth: 1,
        },
      });
      return (
        <View style={{borderColor: '#bb0000', borderWidth: 0.5}}>
          <View style={[styles.box, {padding: 5}]}>
            <Text style={{fontSize: 11}}>5px padding</Text>
          </View>
          <View style={[styles.box, {margin: 5}]}>
            <Text style={{fontSize: 11}}>5px margin</Text>
          </View>
          <View
            style={[
              styles.box,
              {margin: 5, padding: 5, alignSelf: 'flex-start'},
            ]}>
            <Text style={{fontSize: 11}}>5px margin and padding,</Text>
            <Text style={{fontSize: 11}}>widthAutonomous=true</Text>
          </View>
        </View>
      );
    },
  },
  {
    title: 'Border Radius',
    render() {
      return (
        <View style={{borderWidth: 0.5, borderRadius: 5, padding: 5}}>
          <Text style={{fontSize: 11}}>
            Too much use of `borderRadius` (especially large radii) on anything
            which is scrolling may result in dropped frames. Use sparingly.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Border Style',
    render() {
      type Props = $ReadOnly<{||}>;
      type State = {|
        showBorder: boolean,
      |};

      class ViewBorderStyleExample extends React.Component<Props, State> {
        state = {
          showBorder: true,
        };

        render() {
          return (
            <TouchableWithoutFeedback onPress={this._handlePress}>
              <View>
                <View
                  style={[
                    {
                      borderWidth: 1,
                      padding: 5,
                    },
                    this.state.showBorder
                      ? {
                          borderStyle: 'dashed',
                        }
                      : null,
                  ]}>
                  <Text style={{fontSize: 11}}>Dashed border style</Text>
                </View>
                <View
                  style={[
                    {
                      marginTop: 5,
                      borderWidth: 1,
                      borderRadius: 5,
                      padding: 5,
                    },
                    this.state.showBorder
                      ? {
                          borderStyle: 'dotted',
                        }
                      : null,
                  ]}>
                  <Text style={{fontSize: 11}}>Dotted border style</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          );
        }

        _handlePress = () => {
          this.setState({showBorder: !this.state.showBorder});
        };
      }
      return <ViewBorderStyleExample />;
    },
  },
  {
    title: 'Circle with Border Radius',
    render() {
      return (
        <View
          style={{borderRadius: 10, borderWidth: 1, width: 20, height: 20}}
        />
      );
    },
  },
  {
    title: 'Overflow',
    render() {
      const styles = StyleSheet.create({
        container: {
          borderWidth: StyleSheet.hairlineWidth,
          height: 12,
          marginBottom: 8,
          marginEnd: 16,
          width: 95,
        },
        content: {
          height: 20,
          width: 200,
        },
      });

      // NOTE: The <View> that sets `overflow` should only have other layout
      // styles so that we can accurately test view flattening optimizations.
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill]}>
              <Text style={styles.content}>undefined</Text>
            </View>
          </View>
          <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, {overflow: 'hidden'}]}>
              <Text style={styles.content}>hidden</Text>
            </View>
          </View>
          <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, {overflow: 'visible'}]}>
              <Text style={styles.content}>visible</Text>
            </View>
          </View>
        </View>
      );
    },
  },
  {
    title: 'Opacity',
    render() {
      return (
        <View>
          <View style={{opacity: 0}}>
            <Text>Opacity 0</Text>
          </View>
          <View style={{opacity: 0.1}}>
            <Text>Opacity 0.1</Text>
          </View>
          <View style={{opacity: 0.3}}>
            <Text>Opacity 0.3</Text>
          </View>
          <View style={{opacity: 0.5}}>
            <Text>Opacity 0.5</Text>
          </View>
          <View style={{opacity: 0.7}}>
            <Text>Opacity 0.7</Text>
          </View>
          <View style={{opacity: 0.9}}>
            <Text>Opacity 0.9</Text>
          </View>
          <View style={{opacity: 1}}>
            <Text>Opacity 1</Text>
          </View>
        </View>
      );
    },
  },
  {
    title: 'Offscreen Alpha Compositing',
    render() {
      type Props = $ReadOnly<{||}>;
      type State = {|
        active: boolean,
      |};

      const styles = StyleSheet.create({
        alphaCompositing: {
          justifyContent: 'space-around',
          width: 100,
          height: 50,
          borderRadius: 100,
        },
      });

      class OffscreenAlphaCompositing extends React.Component<Props, State> {
        state = {
          active: false,
        };

        render() {
          return (
            <TouchableWithoutFeedback onPress={this._handlePress}>
              <View>
                <Text style={{paddingBottom: 10}}>Blobs</Text>
                <View
                  style={{opacity: 1.0, paddingBottom: 30}}
                  needsOffscreenAlphaCompositing={this.state.active}>
                  <View
                    style={[
                      styles.alphaCompositing,
                      {marginTop: 0, marginLeft: 0, backgroundColor: '#FF6F59'},
                    ]}
                  />
                  <View
                    style={[
                      styles.alphaCompositing,
                      {
                        marginTop: -50,
                        marginLeft: 50,
                        backgroundColor: '#F7CB15',
                      },
                    ]}
                  />
                </View>
                <Text style={{paddingBottom: 10}}>
                  Same blobs, but their shared container have 0.5 opacity
                </Text>
                <Text style={{paddingBottom: 10}}>
                  Tap to {this.state.active ? 'activate' : 'deactivate'}{' '}
                  needsOffscreenAlphaCompositing
                </Text>
                <View
                  style={{opacity: 0.8}}
                  needsOffscreenAlphaCompositing={this.state.active}>
                  <View
                    style={[
                      styles.alphaCompositing,
                      {marginTop: 0, marginLeft: 0, backgroundColor: '#FF6F59'},
                    ]}
                  />
                  <View
                    style={[
                      styles.alphaCompositing,
                      {
                        marginTop: -50,
                        marginLeft: 50,
                        backgroundColor: '#F7CB15',
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          );
        }

        _handlePress = () => {
          this.setState({active: !this.state.active});
        };
      }

      return <OffscreenAlphaCompositing />;
    },
  },
  {
    title: 'ZIndex',
    render() {
      type Props = $ReadOnly<{||}>;
      type State = {|
        flipped: boolean,
      |};

      const styles = StyleSheet.create({
        zIndex: {
          justifyContent: 'space-around',
          width: 100,
          height: 50,
          marginTop: -10,
        },
      });

      class ZIndexExample extends React.Component<Props, State> {
        state = {
          flipped: false,
        };

        render() {
          const indices = this.state.flipped ? [-1, 0, 1, 2] : [2, 1, 0, -1];
          return (
            <TouchableWithoutFeedback onPress={this._handlePress}>
              <View>
                <Text style={{paddingBottom: 10}}>
                  Tap to flip sorting order
                </Text>
                <View
                  style={[
                    styles.zIndex,
                    {
                      marginTop: 0,
                      backgroundColor: '#E57373',
                      zIndex: indices[0],
                    },
                  ]}>
                  <Text>ZIndex {indices[0]}</Text>
                </View>
                <View
                  style={[
                    styles.zIndex,
                    {
                      marginLeft: 50,
                      backgroundColor: '#FFF176',
                      zIndex: indices[1],
                    },
                  ]}>
                  <Text>ZIndex {indices[1]}</Text>
                </View>
                <View
                  style={[
                    styles.zIndex,
                    {
                      marginLeft: 100,
                      backgroundColor: '#81C784',
                      zIndex: indices[2],
                    },
                  ]}>
                  <Text>ZIndex {indices[2]}</Text>
                </View>
                <View
                  style={[
                    styles.zIndex,
                    {
                      marginLeft: 150,
                      backgroundColor: '#64B5F6',
                      zIndex: indices[3],
                    },
                  ]}>
                  <Text>ZIndex {indices[3]}</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          );
        }

        _handlePress = () => {
          this.setState({flipped: !this.state.flipped});
        };
      }
      return <ZIndexExample />;
    },
  },
  {
    title: 'BackfaceVisibility',
    render: function() {
      return (
        <>
          <Text style={{paddingBottom: 10}}>
            View #1, front is visible, back is hidden.
          </Text>
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <View
              style={{
                height: 200,
                width: 200,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'blue',
                backfaceVisibility: 'hidden',
              }}>
              <Text>Front</Text>
            </View>
            <View
              style={{
                height: 200,
                width: 200,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'red',
                backfaceVisibility: 'hidden',
                transform: [{rotateY: '180deg'}],
                position: 'absolute',
                top: 0,
              }}>
              <Text>Back (You should not see this)</Text>
            </View>
          </View>
          <Text style={{paddingVertical: 10}}>
            View #2, front is hidden, back is visible.
          </Text>
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <View
              style={{
                height: 200,
                width: 200,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'blue',
                backfaceVisibility: 'hidden',
              }}>
              <Text>Front (You should not see this)</Text>
            </View>
            <View
              style={{
                height: 200,
                width: 200,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'red',
                backfaceVisibility: 'hidden',
                position: 'absolute',
                top: 0,
              }}>
              <Text>Back</Text>
            </View>
          </View>
        </>
      );
    },
  },
];
