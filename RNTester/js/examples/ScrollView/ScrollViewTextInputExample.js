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

exports.title = '<ScrollView with TextInputs>';
exports.description = 'Displays a list of TextInputs in a ScrollView';
exports.examples = [
  {
    title: 'ScrollView with TextInputs - vertical',
    description:
      'Displays a list of scrollable TextInputs in a vertical ScrollView',
    render: function(): React.Node {
      return (
        <ScrollView nestedScrollEnabled style={{height: 150}}>
          <TextInput
            style={{
              marginTop: 100,
              height: 150,
              width: 200,
              textAlign: 'center',
              fontSize: 50,
              backgroundColor: 'yellow',
            }}
            multiline
            scrollEnabled
            value="WORD1 WORD2 WORD3"
          />
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
          <Text>Normal Text</Text>
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
        <ScrollView horizontal style={{height: 90}}>
          <TextInput
            style={{
              marginLeft: 300,
              height: 90,
              width: 200,
              textAlign: 'center',
              fontSize: 50,
              backgroundColor: 'red',
            }}
            value="WORD1 WORD2 WORD3"
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
