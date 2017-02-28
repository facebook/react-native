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
 * @providesModule NavigatorIOSColorsExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  NavigatorIOS,
  StatusBar,
  StyleSheet,
  Text,
  View
} = ReactNative;

class EmptyPage extends React.Component {
  render() {
    return (
      <View style={styles.emptyPage}>
        <Text style={styles.emptyPageText}>
          {this.props.text}
        </Text>
      </View>
    );
  }
}

class NavigatorIOSColors extends React.Component {
  static title = '<NavigatorIOS> - Custom';
  static description = 'iOS navigation with custom nav bar colors';

  render() {
    // Set StatusBar with light contents to get better contrast
    StatusBar.setBarStyle('light-content');

    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          component: EmptyPage,
          title: '<NavigatorIOS>',
          rightButtonTitle: 'Done',
          onRightButtonPress: () => {
            StatusBar.setBarStyle('default');
            this.props.onExampleExit();
          },
          passProps: {
            text: 'The nav bar has custom colors with tintColor, ' +
              'barTintColor and titleTextColor props.',
          },
        }}
        tintColor="#FFFFFF"
        barTintColor="#183E63"
        titleTextColor="#FFFFFF"
        translucent={true}
      />
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyPage: {
    flex: 1,
    paddingTop: 64,
  },
  emptyPageText: {
    margin: 10,
  },
});

NavigatorIOSColors.external = true;

module.exports = NavigatorIOSColors;
