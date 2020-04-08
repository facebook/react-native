/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import NativeSampleTurboModule from '../../../../Libraries/TurboModule/samples/NativeSampleTurboModule';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as React from 'react';

type State = {|
  testResults: {
    [string]: {
      type: string,
      value: mixed,
      ...
    },
    ...,
  },
|};

class SampleTurboModuleExample extends React.Component<{||}, State> {
  state: State = {
    testResults: {},
  };

  // Add calls to methods in TurboModule here
  _tests = {
    callback: () =>
      NativeSampleTurboModule.getValueWithCallback(callbackValue =>
        this._setResult('callback', callbackValue),
      ),
    promise: () =>
      NativeSampleTurboModule.getValueWithPromise(false).then(valuePromise =>
        this._setResult('promise', valuePromise),
      ),
    rejectPromise: () =>
      NativeSampleTurboModule.getValueWithPromise(true)
        .then(() => {})
        .catch(e => this._setResult('rejectPromise', e.message)),
    getConstants: () => NativeSampleTurboModule.getConstants(),
    voidFunc: () => NativeSampleTurboModule.voidFunc(),
    getBool: () => NativeSampleTurboModule.getBool(true),
    getNumber: () => NativeSampleTurboModule.getNumber(99.95),
    getString: () => NativeSampleTurboModule.getString('Hello'),
    getArray: () =>
      NativeSampleTurboModule.getArray([
        {a: 1, b: 'foo'},
        {a: 2, b: 'bar'},
        null,
      ]),
    getObject: () =>
      NativeSampleTurboModule.getObject({a: 1, b: 'foo', c: null}),
    getValue: () =>
      NativeSampleTurboModule.getValue(5, 'test', {a: 1, b: 'foo'}),
  };

  _setResult(name, result) {
    this.setState(({testResults}) => ({
      /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.122.0 was deployed. To see the error, delete
       * this comment and run Flow. */
      testResults: {
        ...testResults,
        /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses
         * an error found when Flow v0.111 was deployed. To see the error,
         * delete this comment and run Flow. */
        [name]: {value: result, type: typeof result},
      },
    }));
  }

  _renderResult(name) {
    const result = this.state.testResults[name] || {};
    return (
      <View style={styles.result}>
        <Text style={[styles.value]}>{JSON.stringify(result.value)}</Text>
        <Text style={[styles.type]}>{result.type}</Text>
      </View>
    );
  }

  componentDidMount() {
    if (global.__turboModuleProxy == null) {
      throw new Error(
        'Cannot load this example because TurboModule is not configured.',
      );
    }
    if (Platform.OS === 'ios') {
      // iOS is fully implemented, so show all results immediately.
      Object.keys(this._tests).forEach(item =>
        this._setResult(item, this._tests[item]()),
      );
    }
  }

  render(): React.Node {
    return (
      <View style={styles.container}>
        <View style={styles.item}>
          <TouchableOpacity
            style={[styles.column, styles.button]}
            onPress={() =>
              Object.keys(this._tests).forEach(item =>
                this._setResult(item, this._tests[item]()),
              )
            }>
            <Text style={styles.buttonTextLarge}>Run all tests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.setState({testResults: {}})}
            style={[styles.column, styles.button]}>
            <Text style={styles.buttonTextLarge}>Clear results</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={Object.keys(this._tests)}
          keyExtractor={item => item}
          renderItem={({item}) => (
            <View style={styles.item}>
              <TouchableOpacity
                style={[styles.column, styles.button]}
                onPress={e => this._setResult(item, this._tests[item]())}>
                <Text style={styles.buttonText}>{item}</Text>
              </TouchableOpacity>
              <View style={[styles.column]}>{this._renderResult(item)}</View>
            </View>
          )}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    margin: 6,
  },
  column: {
    flex: 2,
    justifyContent: 'center',
    padding: 3,
  },
  result: {
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  type: {
    color: '#333',
    fontSize: 10,
  },
  button: {
    borderColor: '#444',
    padding: 3,
    flex: 1,
  },
  buttonTextLarge: {
    textAlign: 'center',
    color: 'rgb(0,122,255)',
    fontSize: 16,
    padding: 6,
  },
  buttonText: {
    color: 'rgb(0,122,255)',
    textAlign: 'center',
  },
});

module.exports = SampleTurboModuleExample;
