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
const {StrictMode} = React;
const ReactNative = require('react-native');
const {
  Text,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} = ReactNative;
const TouchableBounce = require('TouchableBounce');

type Props = $ReadOnly<{||}>;
type State = {|result: string|};

const componentsToTest = [
  [
    TouchableBounce,
    {
      onPress: () => console.warn('[press]'),
    },
  ],
  [
    TouchableHighlight,
    {
      onPress: () => console.warn('[press]'),
    },
  ],
  [
    // Caveat: Contains ReactNative.findNodeHandle which is not allowed in strict mode
    TouchableNativeFeedback,
    {
      onPress: () => console.warn('[press]'),
      background: TouchableNativeFeedback.Ripple('rgba(0, 0, 255, 0.4)', true),
      children: (
        <View style={{height: 100, backgroundColor: 'red'}}>
          <Text style={{margin: 30}}>I am a TouchableNativeFeedback</Text>
        </View>
      ),
    },
  ],
  [
    TouchableOpacity,
    {
      onPress: () => console.warn('[press]'),
    },
  ],
  [
    TouchableWithoutFeedback,
    {
      onPress: () => console.warn('[press]'),
    },
  ],
];

class StrictModeExample extends React.Component<Props, State> {
  render() {
    return (
      <View>
        <StrictMode>
          {componentsToTest.map(([Component, props]) => (
            <Component key={Component.displayName} {...props}>
              {props.children || <Text>I am a {Component.displayName}</Text>}
            </Component>
          ))}
        </StrictMode>
      </View>
    );
  }
}

exports.framework = 'React';
exports.title = 'StrictMode';
exports.description = 'See components in strict mode.';
exports.examples = [
  {
    title: 'Strict Mode',
    render() {
      return <StrictModeExample />;
    },
  },
];
