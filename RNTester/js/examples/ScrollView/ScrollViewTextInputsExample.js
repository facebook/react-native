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
const {ScrollView, TextInput} = require('react-native');

exports.title = 'ScrollView with TextInputs';
exports.description = 'Displays a list of TextInputs in a ScrollView';
exports.examples = [
  {
    title: 'ScrollView with TextInputs - vertical',
    description:
      'Displays a list of scrollable TextInputs in a vertical ScrollView',
    render(): React.Element<any> {
      return (
        <ScrollView style={{flex: 1}}>
          <TextInput placeholder="default" />
          <TextInput placeholder="center" style={{textAlign: 'center'}} />
          <TextInput placeholder="right" style={{textAlign: 'right'}} />
          <TextInput placeholder="left" style={{textAlign: 'left'}} />
          <TextInput value="[default] even with large content, this TextInput is still horizontally scrollable" />
          <TextInput
            style={{textAlign: 'center'}}
            value="[center] even with large content, this TextInput is still horizontally scrollable"
          />
          <TextInput
            style={{textAlign: 'right'}}
            value="[right] even with large content, this TextInput is still horizontally scrollable"
          />
          <TextInput
            value="[left] even with large content, this TextInput is still horizontally scrollable"
            style={{textAlign: 'left'}}
          />
          <TextInput
            multiline
            value={
              "[multiline-default] possible to scroll from me, because I don't scroll internally"
            }
          />
          <TextInput
            multiline
            style={{textAlign: 'center'}}
            value="[multiline-center] possible to scroll from me, because I don't scroll internally"
          />
          <TextInput
            multiline
            style={{textAlign: 'right'}}
            value="[multiline-right] possible to scroll from me, because I don't scroll internally"
          />
          <TextInput
            multiline
            style={{textAlign: 'left'}}
            value="[multiline-left] possible to scroll from me, because I don't scroll internally"
          />
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
        <ScrollView horizontal style={{flex: 1}}>
          <TextInput placeholder="default" style={{width: 40}} />
          <TextInput
            placeholder="center"
            style={{textAlign: 'center', width: 40}}
          />
          <TextInput
            placeholder="right"
            style={{textAlign: 'right', width: 40}}
          />
          <TextInput
            placeholder="left"
            style={{textAlign: 'left', width: 40}}
          />
          <TextInput
            value="[default] even with large content, this TextInput is still horizontally scrollable"
            style={{width: 40}}
          />
          <TextInput
            style={{textAlign: 'center', width: 40}}
            value="[center] even with large content, this TextInput is not horizontally scrollable"
          />
          <TextInput
            style={{textAlign: 'right', width: 40}}
            value="[right] even with large content, this TextInput is not horizontally scrollable"
          />
          <TextInput
            value="[left]with large content, this TextInput is not horizontally scrollable"
            style={{textAlign: 'left', width: 40}}
          />
          <TextInput
            multiline
            style={{width: 40}}
            value={
              "[multiline-default] possible to scroll from me, because I don't scroll internally"
            }
          />
          <TextInput
            multiline
            style={{textAlign: 'center', width: 40}}
            value="[multiline-center] possible to scroll from me, because I don't scroll internally"
          />
          <TextInput
            multiline
            style={{textAlign: 'right', width: 40}}
            value="[multiline-right] possible to scroll from me, because I don't scroll internally"
          />
          <TextInput
            multiline
            style={{textAlign: 'left', width: 40}}
            value="[multiline-left] possible to scroll from me, because I don't scroll internally"
          />
        </ScrollView>
      );
    },
  },
];
