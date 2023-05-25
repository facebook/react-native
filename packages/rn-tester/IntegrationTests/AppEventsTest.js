/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const {NativeAppEventEmitter, StyleSheet, Text, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

const deepDiffer = require('react-native/Libraries/Utilities/differ/deepDiffer');

const TEST_PAYLOAD = {foo: 'bar'};

type AppEvent = {
  data: Object,
  ts: number,
  ...
};
type State = {
  sent: 'none' | AppEvent,
  received: 'none' | AppEvent,
  elapsed?: string,
  ...
};

class AppEventsTest extends React.Component<{...}, State> {
  state: State = {sent: 'none', received: 'none'};

  componentDidMount() {
    NativeAppEventEmitter.addListener('testEvent', this.receiveEvent);
    const event = {data: TEST_PAYLOAD, ts: Date.now()};
    TestModule.sendAppEvent('testEvent', event);
    this.setState({sent: event});
  }

  receiveEvent: (event: any) => void = (event: any) => {
    if (deepDiffer(event.data, TEST_PAYLOAD)) {
      throw new Error('Received wrong event: ' + JSON.stringify(event));
    }
    const elapsed = Date.now() - event.ts + 'ms';
    this.setState({received: event, elapsed}, () => {
      TestModule.markTestCompleted();
    });
  };

  render(): React.Node {
    return (
      <View style={styles.container}>
        <Text>{JSON.stringify(this.state, null, '  ')}</Text>
      </View>
    );
  }
}

AppEventsTest.displayName = 'AppEventsTest';

const styles = StyleSheet.create({
  container: {
    margin: 40,
  },
});

module.exports = AppEventsTest;
