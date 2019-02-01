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
const ReactNative = require('react-native');
const {AccessibilityInfo, Text, View, TouchableOpacity, Alert} = ReactNative;

const RNTesterBlock = require('./RNTesterBlock');

type Props = $ReadOnly<{||}>;
class AccessibilityIOSExample extends React.Component<Props> {
  render() {
    return (
      <RNTesterBlock title="Accessibility iOS APIs">
        <View
          onAccessibilityTap={() =>
            Alert.alert('Alert', 'onAccessibilityTap success')
          }
          accessible={true}>
          <Text>Accessibility normal tap example</Text>
        </View>
        <View
          onMagicTap={() => Alert.alert('Alert', 'onMagicTap success')}
          accessible={true}>
          <Text>Accessibility magic tap example</Text>
        </View>
        <View
          onAccessibilityEscape={() => alert('onAccessibilityEscape success')}
          accessible={true}>
          <Text>Accessibility escape example</Text>
        </View>
        <View accessibilityElementsHidden={true}>
          <Text>
            This view's children are hidden from the accessibility tree
          </Text>
        </View>
      </RNTesterBlock>
    );
  }
}

exports.title = 'AccessibilityIOS';
exports.description = 'iOS specific Accessibility APIs';
exports.examples = [
  {
    title: 'iOS Accessibility elements',
    render(): React.Element<any> {
      return <AccessibilityIOSExample />;
    },
  },
];
