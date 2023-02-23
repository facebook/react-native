/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeSampleTurboModule from 'react-native/Libraries/TurboModule/samples/NativeSampleTurboModule';
import {EnumInt} from 'react-native/Libraries/TurboModule/samples/NativeSampleTurboModule';
import type {RootTag} from 'react-native/Libraries/ReactNative/RootTag';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
  TouchableOpacity,
  RootTagContext,
} from 'react-native';
import * as React from 'react';

type State = {|
  testResults: {
    [string]: {
      type: string,
      value: mixed,
      ...
    },
    ...
  },
|};

class SampleTurboModuleExample extends React.Component<{||}, State> {
  static contextType: React$Context<RootTag> = RootTagContext;

  state: State = {
    testResults: {},
  };

  // Add calls to methods in TurboModule here
  // $FlowFixMe[missing-local-annot]
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
    getEnum: () =>
      NativeSampleTurboModule.getEnum
        ? NativeSampleTurboModule.getEnum(EnumInt.A)
        : null,
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
    getUnsafeObject: () =>
      NativeSampleTurboModule.getObject({a: 1, b: 'foo', c: null}),
    getRootTag: () => NativeSampleTurboModule.getRootTag(this.context),
    getValue: () =>
      NativeSampleTurboModule.getValue(5, 'test', {a: 1, b: 'foo'}),
  };

  _setResult(
    name:
      | string
      | 'callback'
      | 'getArray'
      | 'getBool'
      | 'getEnum'
      | 'getConstants'
      | 'getNumber'
      | 'getObject'
      | 'getRootTag'
      | 'getString'
      | 'getUnsafeObject'
      | 'getValue'
      | 'promise'
      | 'rejectPromise'
      | 'voidFunc',
    result:
      | $FlowFixMe
      | void
      | RootTag
      | Promise<mixed>
      | number
      | string
      | boolean
      | {const1: boolean, const2: number, const3: string}
      | Array<$FlowFixMe>,
  ) {
    this.setState(({testResults}) => ({
      /* $FlowFixMe[cannot-spread-indexer] (>=0.122.0 site=react_native_fb)
       * This comment suppresses an error found when Flow v0.122.0 was
       * deployed. To see the error, delete this comment and run Flow. */
      testResults: {
        ...testResults,
        /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb)
         * This comment suppresses an error found when Flow v0.111 was
         * deployed. To see the error, delete this comment and run Flow. */
        [name]: {value: result, type: typeof result},
      },
    }));
  }

  _renderResult(name: string): React.Node {
    const result = this.state.testResults[name] || {};
    return (
      <View style={styles.result}>
        <Text style={[styles.value]}>{JSON.stringify(result.value)}</Text>
        <Text style={[styles.type]}>{result.type}</Text>
      </View>
    );
  }

  componentDidMount(): void {
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
