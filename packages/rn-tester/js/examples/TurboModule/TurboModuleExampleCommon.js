/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import {Platform, StyleSheet} from 'react-native';

// $FlowFixMe[value-as-type]
const styles: StyleSheet = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    margin: 2,
  },
  column: {
    flex: 2,
    justifyContent: 'center',
    paddingLeft: 5,
    paddingRight: 5,
  },
  result: {
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
  },
  type: {
    color: '#333',
    fontSize: 8,
  },
  button: {
    borderColor: '#444',
    padding: 3,
    flex: 1,
  },
  buttonTextLarge: {
    textAlign: 'center',
    color: 'rgb(0,122,255)',
    fontSize: 16,
    padding: 6,
  },
  buttonText: {
    color: 'rgb(0,122,255)',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default styles;
