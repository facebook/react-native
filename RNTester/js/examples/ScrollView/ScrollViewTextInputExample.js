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

exports.title = 'ScrollView with TextInputs';
exports.description = 'Displays a list of TextInputs in a ScrollView';
exports.examples = [
  {
    title: 'ScrollView with TextInputs - vertical',
    description:
      'Displays a list of scrollable TextInputs in a vertical ScrollView',
    render: function(): React.Node {
      const text = 'WORD1 WORD2 WORD3 WORD4 WORD5';
      return (
        <ScrollView style={{height: 50}}>
          <TextInput
            style={{height: 50, width: 150, textAlign: 'center'}}
            multiline
            scrollEnabled
            value={text}
          />
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
        <ScrollView horizontal style={{height: 800}}>
          <TextInput
            style={{
              height: 200,
              width: 400,
              textAlign: 'center',
              backgroundColor: 'red',
              fontSize: 170,
            }}
            value="WORD1 WORD2 WORD3 WORD4 WORD5"
          />
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
        </ScrollView>
      );
    },
  },
];
