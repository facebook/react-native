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
const {ScrollView, Text} = ReactNative;

type Props = $ReadOnly<{||}>;
type State = {|result: string|};

const componentsToTest = [ScrollView];

class StrictModeExample extends React.Component<Props, State> {
  render() {
    return (
      <StrictMode>
        {componentsToTest.map(Component => (
          <Component key={Component.displayName}>
            <Text>{Component.displayName}</Text>
          </Component>
        ))}
      </StrictMode>
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
