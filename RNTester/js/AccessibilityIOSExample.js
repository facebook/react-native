/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule AccessibilityIOSExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AccessibilityInfo,
  Text,
  View,
} = ReactNative;

class AccessibilityIOSExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View
          onAccessibilityTap={() => alert('onAccessibilityTap success')}
          accessible={true}>
          <Text>
            Accessibility normal tap example
          </Text>
        </View>
        <View onMagicTap={() => alert('onMagicTap success')}
              accessible={true}>
          <Text>
            Accessibility magic tap example
          </Text>
        </View>
        <View accessibilityLabel="Some announcement"
              accessible={true}>
          <Text>
            Accessibility label example
          </Text>
        </View>
        <View accessibilityTraits={['button', 'selected']}
              accessible={true}>
          <Text>
            Accessibility traits example
          </Text>
        </View>
        <Text>
          Text's accessibilityLabel is the raw text itself unless it is set explicitly.
        </Text>
        <Text accessibilityLabel="Test of accessibilityLabel"
          accessible={true}>
          This text component's accessibilityLabel is set explicitly.
        </Text>
      </View>
    );
  }
}

class ScreenReaderStatusExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    screenReaderEnabled: false,
  }

  componentDidMount() {
    AccessibilityInfo.addEventListener(
      'change',
      this._handleScreenReaderToggled
    );
    AccessibilityInfo.fetch().done((isEnabled) => {
      this.setState({
        screenReaderEnabled: isEnabled
      });
    });
  }

  componentWillUnmount() {
    AccessibilityInfo.removeEventListener(
      'change',
      this._handleScreenReaderToggled
    );
  }

  _handleScreenReaderToggled = (isEnabled) => {
    this.setState({
      screenReaderEnabled: isEnabled,
    });
  }

  render() {
    return (
      <View>
        <Text>
          The screen reader is {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.
        </Text>
      </View>
    );
  }
}

exports.title = 'AccessibilityIOS';
exports.description = 'Interface to show iOS\' accessibility samples';
exports.examples = [
  {
    title: 'Accessibility elements',
    render(): React.Element<any> { return <AccessibilityIOSExample />; }
  },
  {
    title: 'Check if the screen reader is enabled',
    render(): React.Element<any> { return <ScreenReaderStatusExample />; }
  },
];
