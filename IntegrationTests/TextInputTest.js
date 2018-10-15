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
const {View, TextInput} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

function expectTrue(condition: boolean, message: string): boolean {
  if (!condition) {
    throw new Error(message);
  }

  return condition;
}

class TextInputTest extends React.Component<{}, $FlowFixMeState> {
  textInputRef: any;
  state = {
    text: '123',
  };

  componentDidMount() {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }

    this.updateText();
  }

  updateText() {
    // set native cursor to 0
    this.textInputRef.setNativeProps({selection: {start: 0, end: 0}});

    this.setState({text: '0'.concat(this.state.text)}, () => {
      const componentState = this.state.text;

      this.done(
        expectTrue(
          componentState === '0123',
          'Component updates the state text property correctly.',
        ),
      );
    });
  }

  done = (success: boolean) => {
    TestModule.markTestPassed(success);
  };

  render() {
    return (
      <View>
        <TextInput
          ref={ref => (this.textInputRef = ref)}
          maxLength={5}
          value={this.state.text}
        />
      </View>
    );
  }
}

TextInputTest.displayName = 'TextInputTest';

module.exports = TextInputTest;
