/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {Alert, Button, DevSettings} from 'react-native';

exports.title = 'DevSettings';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/devsettings';
exports.description = 'Customize the development settings';
exports.examples = [
  {
    title: 'Add dev menu item',
    render(): React.MixedElement {
      return (
        <Button
          title="Add"
          onPress={() => {
            DevSettings.addMenuItem('Show Secret Dev Screen', () => {
              Alert.alert('Showing secret dev screen!');
            });
          }}
        />
      );
    },
  },
  {
    title: 'Reload the app',
    render(): React.MixedElement {
      return (
        <Button
          title="Reload"
          onPress={() => {
            DevSettings.reload();
          }}
        />
      );
    },
  },
];
