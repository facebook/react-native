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
const {ScrollView, Text, TextInput} = require('react-native');

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';

exports.title = 'ScrollView with TextInputs';
exports.description = 'Displays a list of TextInputs in a ScrollView';
exports.examples = [
  {
    title: 'ScrollView with TextInputs - vertical',
    description:
      'Displays a list of scrollable TextInputs in a vertical ScrollView',
    render: function(): React.Node {
      return (
        <ScrollView 
          style={{height:50}}>
          <TextInput 
            style={{height:50, width: 450, textAlign: 'center' }}
            multiline 
            scrollEnabled 
            value={"WORD1 \nWORD2 \nWORD3 \nWORD4 \nWORD5"} />
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
        </ScrollView>
      );
    },
  },
  {
    title: 'ScrollView with TextInputs - horizontal',
    description:
      'Displays a list of scrollable TextInputs in a horizontal ScrollView',
    render(): React.Element<any> {
      return (
        <ScrollView horizontal>
          <TextInput 
            style={{ height:100, width: 200, textAlign: 'center'}} 
            value='WORD1 WORD2 WORD3 WORD4 WORD5' />
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
        </ScrollView>
      );
    },
  },
];
