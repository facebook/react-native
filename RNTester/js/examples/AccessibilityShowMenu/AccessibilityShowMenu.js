/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict'; // TODO(OSS Candidate ISS#2710739)

const React = require('react');
const ReactNative = require('react-native');
const {Button, Text, View} = ReactNative;

import {Platform} from 'react-native';
import type {AccessibilityActionEvent} from 'react-native/Libraries/Components/View/ViewAccessibility';

class AccessibilityShowMenu extends React.Component<{}> {
  onClick: () => void = () => {
    console.log('received click event\n');
  };

  onAccessibilityAction: (e: AccessibilityActionEvent) => void = e => {
    if (e.nativeEvent.actionName === 'showMenu') {
      console.log('received accessibility show event\n');
    }
  };

  render() {
    return (
      <View>
        <Text>
          Accessibility Show Menu action is dispatched when the OS triggers it
        </Text>
        <View>
          {Platform.OS === 'macos' ? (
            <Button
              title={'Test button'}
              onPress={this.onClick}
              accessibilityRole={'menubutton'}
              accessibilityActions={[{name: 'showMenu'}]}
              accessibilityHint={
                'For more options, press Control-Option-Shift-M'
              }
              onAccessibilityAction={this.onAccessibilityAction}
            />
          ) : null}
        </View>
      </View>
    );
  }
}

exports.title = 'Accessibiltiy Show Menu action';
exports.description =
  'Examples that show how Accessibility Show Menu action can be used.';
exports.examples = [
  {
    title: 'AccessibilityShowMenu',
    render: function(): React.Element<any> {
      return <AccessibilityShowMenu />;
    },
  },
];
