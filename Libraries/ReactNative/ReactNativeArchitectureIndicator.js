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

const React = require('react');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const View = require('../Components/View/View');

const hasTurboModule = global.__turboModuleProxy != null;
const isBridgeless = global.RN$Bridgeless === true;

function ReactNativeArchitectureIndicator(props: {|
  fabric: boolean,
|}): React.Node {
  const parts = [];
  if (isBridgeless) {
    parts.push('NOBRIDGE');
  } else {
    if (props.fabric) {
      parts.push('FABRIC');
    }
    if (hasTurboModule) {
      parts.push('TM');
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{parts.join('+')}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0, 0.25)',
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 2,
  },
  text: {
    fontSize: 6,
    color: '#ffffff',
  },
});
module.exports = ReactNativeArchitectureIndicator;
