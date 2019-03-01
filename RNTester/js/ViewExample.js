/**
 * Copyright (c) 2015-present, Facebook, Inc.
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
const {Button, StyleSheet, Text, View} = require('react-native');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');

// [TODO(windows ISS)
const TouchableNativeFeedback = require('TouchableNativeFeedback');

class ViewFocusEventsExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    showSampleViews: false,
    showTextView: false,
  };

  defaultFocusView: ?React.ElementRef<typeof View>;
  view1: ?React.ElementRef<typeof View>;
  view2: ?React.ElementRef<typeof View>;

  render() {
    const styles = StyleSheet.create({
      focusView: {
        backgroundColor: '#527FE4',
        borderColor: '#000033',
        borderWidth: 1,
      },
    });
    return (
      <View>
        <Button onPress={() => this.setState({showSampleViews: !this.state.showSampleViews})} title={(this.state.showSampleViews) ? 'Hide Sample Focus event View' : 'Show Sample View'} />
        <Button onPress={() => this.defaultFocusView ? this.defaultFocusView.focus() : null} title={'Give Focus to default View'} />
        { (this.state.showSampleViews) ?
        <View> 
          <Text> Enter on any view will move focus within this view </Text>
          <TouchableNativeFeedback onPress={() => this.defaultFocusView ? this.defaultFocusView.focus() : null}>
            <View ref = {v => this.view1 = v} style={[ styles.focusView]} >
              <Text> Test View</Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback onPress={() => this.view2 ? this.view2.focus() : null}>
            <View ref = {v => this.defaultFocusView = v} style={[ styles.focusView]} >
              <Text> Default Focus View </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback onPress={() => this.view1 ? this.view1.focus() : null}>
            <View ref = {v => this.view2 = v}
              style={[ styles.focusView]}
              onFocusChange = {(hasFocus) => {this.setState({showTextView: hasFocus})}}>
              <Text> Show sample textview on focus </Text>
            </View>
          </TouchableNativeFeedback>
          {
            this.state.showTextView ? 
            <Text> This is a sample Text</Text>
            : null
          }
        </View> 
        : null }
      </View>
    );
  }
}
// ]TODO(windows ISS)

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
                  style={{
                    borderWidth: 1,
                    borderStyle: this.state.showBorder ? 'dashed' : null,
                    padding: 5,
                  }}>
                  <Text style={{fontSize: 11}}>Dashed border style</Text>
                </View>
                <View
                  style={{
                    marginTop: 5,
                    borderWidth: 1,
                    borderRadius: 5,
                    borderStyle: this.state.showBorder ? 'dotted' : null,
                    padding: 5,
                  }}>
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
  { // [TODO(macOS ISS#2323203)
    title: 'ToolTip',
    render() {
      return (
        <View tooltip='Parent View'>
          <Text style={{ fontSize: 11 }}>
            This Parent View has tooltip "Parent View"
          </Text>
          <View tooltip='Child View 1'>
            <Text style={{ fontSize: 11 }}>
              This view has tooltip "Child View 1"
            </Text>
          </View>
          <View tooltip='Child View 2'>
            <Text style={{ fontSize: 11 }}>
              This view has tooltip "Child View 2"
            </Text>
          </View>
        </View>
      );
    },
  }, // ]TODO(macOS ISS#2323203)
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
];
