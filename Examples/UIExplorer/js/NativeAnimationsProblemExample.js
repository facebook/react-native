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
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
} = ReactNative;

class Tester extends React.Component {

  static title = 'Native Animated Problem';
  static description = 'Test out Native Animations';

  state = {
    opacity: new Animated.Value(0.25, {useNativeDriver: true}),
    showBlock2: false,
  };

  visible = false;

  runAnimation = () => {
    this.visible = !this.visible;
    Animated.timing(this.state.opacity, {
      toValue: this.visible ? 1 : 0.25,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <TouchableWithoutFeedback onPress={this.runAnimation}>
            <View style={styles.button}>
              <Text>{'Run animation'}</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.section}>
          <TouchableWithoutFeedback onPress={() => {
            this.setState({
              showBlock2: !this.state.showBlock2,
            });
          }}>
            <View style={styles.button}>
              <Text>{'Toggle block 2'}</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.section}>
          {this._renderBlock(1)}
        </View>
        <View style={styles.section}>
          {this.state.showBlock2 && this._renderBlock(2)}
        </View>
      </View>
    );
  }

  _renderBlock(key: number) {
    return (
      <Animated.View
          key={key}
          style={[
            styles.block,
            {
              opacity: this.state.opacity,
            }
          ]}
        />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  button: {
    padding: 10,
    backgroundColor: 'green',
  },
  section: {
    marginBottom: 20,
  },
  block: {
    width: 50,
    height: 50,
    backgroundColor: 'blue',
  },
});

module.exports = Tester;
