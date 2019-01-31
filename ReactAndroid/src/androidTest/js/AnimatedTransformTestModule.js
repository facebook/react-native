/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AnimatedTransformTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');
var TouchableOpacity = require('TouchableOpacity');
var Text = require('Text');
var RecordingModule = require('NativeModules').Recording;

const styles = StyleSheet.create({
  base: {
    width: 200,
    height: 200,
    backgroundColor: 'red',
    transform: [{rotate: '0deg'}],
  },
  transformed: {
    transform: [{rotate: '45deg'}],
  },
});

/**
 * This app presents a TouchableOpacity which was the simplest way to
 * demonstrate this issue. Tapping the TouchableOpacity causes an animated
 * transform to be created for the rotation property. Since the property isn't
 * animated itself, it comes through as a static property, but static properties
 * can't currently handle strings which causes a string->double cast exception.
 */
class AnimatedTransformTestApp extends React.Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
  }

  state = {
    flag: false,
  };

  toggle() {
    this.setState({
      flag: !this.state.flag,
    });
  }

  render() {
    // Using this to verify if its fixed.
    RecordingModule.record('render');

    return (
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          onPress={this.toggle}
          testID="TouchableOpacity"
          style={[styles.base, this.state.flag ? styles.transformed : null]}>
            <Text>TouchableOpacity</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

var AnimatedTransformTestModule = {
  AnimatedTransformTestApp: AnimatedTransformTestApp,
};

BatchedBridge.registerCallableModule(
  'AnimatedTransformTestModule',
  AnimatedTransformTestModule
);

module.exports = AnimatedTransformTestModule;
