/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const TabBarItemIOS = require('TabBarItemIOS');
const View = require('View');

let showedDeprecationWarning = false;

class DummyTabBarIOS extends React.Component<$FlowFixMeProps> {
  static Item = TabBarItemIOS;

  componentDidMount() {
    if (!showedDeprecationWarning) {
      console.warn(
        'TabBarIOS and TabBarItemIOS are deprecated and will be removed in a future release. ' +
          'Please use react-native-tab-view instead.',
      );

      showedDeprecationWarning = true;
    }
  }

  render() {
    return (
      <View style={[this.props.style, styles.tabGroup]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  },
});

module.exports = DummyTabBarIOS;
