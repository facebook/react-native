/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {NewAppScreen} = require('@react-native/new-app-screen');
const React = require('react');
const {ScrollView} = require('react-native');

exports.title = 'New App Screen';
exports.description = 'Displays the content of the new app screen';
exports.examples = [
  {
    title: 'New App Screen',
    render(): React.MixedElement {
      return (
        <ScrollView>
          <NewAppScreen />
        </ScrollView>
      );
    },
  },
];
