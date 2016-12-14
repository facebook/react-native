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
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  HapticFeedbackIOS,
} = ReactNative;

exports.framework = 'React';
exports.title = 'Haptic Feedback iOS';
exports.description = 'Haptic Feedback API';

exports.examples = [
  {
    title: 'HapticFeedbackIOS.prepare()',
    render() {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => HapticFeedbackIOS.prepare()}>
          <View style={styles.button}>
            <Text>Prepare Taptic Engine for Haptic Feedback</Text>
          </View>
        </TouchableHighlight>
      );
    }
  },{
    title: "HapticFeedback.setType('impact')",
    render() {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => HapticFeedbackIOS.generate('impact')}>
          <View style={styles.button}>
            <Text>Impact Feedback</Text>
          </View>
        </TouchableHighlight>
      );
    }
  },
  {
  title: "HapticFeedbackIOS.setType('notification')",
  render() {
    return (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() => HapticFeedbackIOS.generate('notification')}>
        <View style={styles.button}>
          <Text>Notification Feedback</Text>
        </View>
      </TouchableHighlight>
    );
  }
},
{
  title: "HapticFeedbackIOS.setType('selection')",
  render() {
    return (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() => HapticFeedbackIOS.generate('selection')}>
        <View style={styles.button}>
          <Text>Selection Changed Feedback</Text>
        </View>
      </TouchableHighlight>
    );
  }
},
];

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});
