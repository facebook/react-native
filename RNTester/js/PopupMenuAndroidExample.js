/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule PopupMenuExample
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const StyleSheet = require('StyleSheet');
const RNTesterBlock = require('RNTesterBlock');
const RNTesterPage = require('RNTesterPage');

const {
  PopupMenuAndroid,
  ToastAndroid,
  View,
  Text,
} = ReactNative;

class PopupMenuExample extends React.Component {
  static title = '<PopupMenuAndroid>';
  static description = 'Provides a popup menu with options to choose from.';

  _menu: any;

  render() {
    return (
      <RNTesterPage title="<PopupMenuAndroid>">
        <RNTesterBlock title="Handle automatically">
          <View style={styles.center}>
            <PopupMenuAndroid
              items={[
                { value: 'Apples' },
                { value: 'Oranges' }
              ]}
              onDismiss={() => ToastAndroid.show('Dismissed', ToastAndroid.SHORT)}
              onItemSelect={({ value }) => ToastAndroid.show(`Selected ${value}`, ToastAndroid.SHORT)}
              >
              <Text style={styles.label} >
                Press me
              </Text>
            </PopupMenuAndroid>
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="Show with a ref">
          <View style={styles.right}>
            <PopupMenuAndroid
              items={[
                { value: 'Apples' },
                { value: 'Oranges' }
              ]}
              onDismiss={() => ToastAndroid.show('Dismissed', ToastAndroid.SHORT)}
              onItemSelect={({ value }) => ToastAndroid.show(`Selected ${value}`, ToastAndroid.SHORT)}
              ref={c => this._menu = c}
              >
              <Text style={styles.label} onPress={() => this._menu.show()}>
                Press me
              </Text>
            </PopupMenuAndroid>
          </View>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

var styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  label: {
    margin: 8,
  }
});

module.exports = PopupMenuExample;
