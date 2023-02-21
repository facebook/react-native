/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

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
import NativeCxxModuleExample, {
  EnumInt,
  EnumNone,
} from '../../../NativeCxxModuleExample/NativeCxxModuleExample';

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

type Examples =
  | 'callback'
  | 'getArray'
  | 'getBool'
  | 'getConstants'
  | 'getCustomEnum'
  | 'getNumEnum'
  | 'getStrEnum'
  | 'getMap'
  | 'getNumber'
  | 'getObject'
  | 'getSet'
  | 'getString'
  | 'getUnion'
  | 'getValue'
  | 'promise'
  | 'rejectPromise'
  | 'voidFunc';

class NativeCxxModuleExampleExample extends React.Component<{||}, State> {
  static contextType: React$Context<RootTag> = RootTagContext;

  state: State = {
    testResults: {},
  };

  // Add calls to methods in TurboModule here
  // $FlowFixMe[missing-local-annot]
  _tests = {
    callback: () =>
      NativeCxxModuleExample?.getValueWithCallback(callbackValue =>
        this._setResult('callback', callbackValue),
      ),
    getArray: () =>
      NativeCxxModuleExample?.getArray([
        {a: 1, b: 'foo'},
        {a: 2, b: 'bar'},
        null,
      ]),
    getBool: () => NativeCxxModuleExample?.getBool(true),
    getConstants: () => NativeCxxModuleExample?.getConstants(),
    getCustomEnum: () => NativeCxxModuleExample?.getCustomEnum(EnumInt.IB),
    getNumEnum: () => NativeCxxModuleExample?.getNumEnum(EnumInt.IB),
    getStrEnum: () => NativeCxxModuleExample?.getStrEnum(EnumNone.NB),
    getNumber: () => NativeCxxModuleExample?.getNumber(99.95),
    getObject: () =>
      NativeCxxModuleExample?.getObject({a: 1, b: 'foo', c: null}),
    getSet: () => NativeCxxModuleExample?.getSet([1, 1.1, 1.1, 1.1, 2]),
    getString: () => NativeCxxModuleExample?.getString('Hello'),
    getUnion: () => NativeCxxModuleExample?.getUnion(1.44, 'Two', {low: '12'}),
    getValue: () =>
      NativeCxxModuleExample?.getValue(5, 'test', {a: 1, b: 'foo'}),
    promise: () =>
      NativeCxxModuleExample?.getValueWithPromise(false).then(valuePromise =>
        this._setResult('promise', valuePromise),
      ),
    rejectPromise: () =>
      NativeCxxModuleExample?.getValueWithPromise(true)
        .then(() => {})
        .catch(e => this._setResult('rejectPromise', e.message)),
    voidFunc: () => NativeCxxModuleExample?.voidFunc(),
  };

  _setResult(
    name: string | Examples,
    result:
      | $FlowFixMe
      | void
      | Array<$FlowFixMe>
      | boolean
      | {const1: boolean, const2: number, const3: string}
      | number
      | {[key: string]: ?number}
      | Promise<mixed>
      | number
      | string,
  ) {
    this.setState(({testResults}) => ({
      testResults: {
        ...testResults,
        /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb)
         * This comment suppresses an error found when Flow v0.111 was
         * deployed. To see the error, delete this comment and run Flow. */
        [name]: {value: result, type: typeof result},
      },
    }));
  }

  _renderResult(name: Examples): React.Node {
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
    Object.keys(this._tests).forEach(item =>
      this._setResult(item, this._tests[item]()),
    );
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
          // $FlowFixMe[incompatible-type]
          data={Object.keys(this._tests)}
          keyExtractor={item => item}
          renderItem={({item}: {item: Examples, ...}) => (
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

module.exports = NativeCxxModuleExampleExample;
