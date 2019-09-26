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
const {Text, View, Alert} = require('react-native');

const RNTesterBlock = require('./RNTesterBlock');

type Props = $ReadOnly<{||}>;
class AccessibilityIOSExample extends React.Component<Props> {
  render() {
    return (
      <RNTesterBlock title="Accessibility iOS APIs">
        <View
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'activate') {
              Alert.alert('Alert', 'onAccessibilityTap success');
            }
          }}
          accessible={true}
          accessibilityActions={[{name: 'activate'}]}>
          <Text>Accessibility normal tap example</Text>
        </View>
        <View
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'magicTap') {
              Alert.alert('Alert', 'onMagicTap success');
            }
          }}
          accessible={true}
          accessibilityActions={[{name: 'magicTap'}]}>
          <Text>Accessibility magic tap example</Text>
        </View>
        <View
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'escape') {
              Alert.alert('onAccessibilityEscape success');
            }
          }}
          accessible={true}
          accessibilityActions={[{name: 'escape'}]}>
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
