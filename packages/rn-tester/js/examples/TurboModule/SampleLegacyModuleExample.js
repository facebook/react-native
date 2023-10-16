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

import * as React from 'react';
import {
  FlatList,
  NativeModules,
  RootTagContext,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import styles from './TurboModuleExampleCommon';

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

let triedLoadingModuleOnce = false;
let module = null;

function getSampleLegacyModule() {
  if (triedLoadingModuleOnce) {
    return module;
  }
  triedLoadingModuleOnce = true;
  try {
    module = NativeModules.SampleLegacyModule;
  } catch (ex) {
    console.error('Failed to load SampleLegacyModule. Message: ' + ex.message);
  }
  return module;
}

function stringify(obj: mixed): string {
  function replacer(_: string, value: mixed) {
    if (value instanceof Object && !(value instanceof Array)) {
      return Object.keys(value ?? {})
        .sort()
        .reduce((sorted: {[key: string]: mixed}, key: string) => {
          sorted[key] = (value ?? {})[key];
          return sorted;
        }, {});
    }
    return value;
  }

  return (JSON.stringify(obj, replacer) || '').replaceAll('"', "'");
}

class SampleLegacyModuleExample extends React.Component<{||}, State> {
  static contextType: React$Context<RootTag> = RootTagContext;

  state: State = {
    testResults: {},
  };

  // Add calls to methods in TurboModule here
  // $FlowFixMe[missing-local-annot]
  _tests =
    Platform.OS === 'ios'
      ? {
          voidFunc: () => getSampleLegacyModule()?.voidFunc(),
          getBool: () => getSampleLegacyModule()?.getBool(true),
          getEnum: () => getSampleLegacyModule()?.getEnum(1.0),
          getNumber: () => getSampleLegacyModule()?.getNumber(99.95),
          getFloat: () => getSampleLegacyModule()?.getNumber(99.95),
          getInt: () => getSampleLegacyModule()?.getInt(99),
          getLongLong: () => getSampleLegacyModule()?.getLongLong(99),
          getUnsignedLongLong: () =>
            getSampleLegacyModule()?.getUnsignedLongLong(99),
          getNSInteger: () => getSampleLegacyModule()?.getNSInteger(99),
          getNSUInteger: () => getSampleLegacyModule()?.getNSUInteger(99),
          getArray: () =>
            getSampleLegacyModule()?.getArray([
              {a: 1, b: 'foo'},
              {a: 2, b: 'bar'},
              null,
            ]),
          getObject: () =>
            getSampleLegacyModule()?.getObject({a: 1, b: 'foo', c: null}),
          getString: () => getSampleLegacyModule()?.getString('Hello'),
          getNullString: () => getSampleLegacyModule()?.getString(null),
          getNSNumber: () => getSampleLegacyModule()?.getNSNumber(20.0),
          getUnsafeObject: () =>
            getSampleLegacyModule()?.getObject({a: 1, b: 'foo', c: null}),
          getRootTag: () => getSampleLegacyModule()?.getRootTag(11),
          getValue: () =>
            getSampleLegacyModule()?.getValue(5, 'test', {a: 1, b: 'foo'}),
          callback: () =>
            getSampleLegacyModule()?.getValueWithCallback(callbackValue =>
              this._setResult('callback', callbackValue),
            ),
          promise: () =>
            getSampleLegacyModule()
              ?.getValueWithPromise(false)
              .then(valuePromise => this._setResult('promise', valuePromise)),
          rejectPromise: () =>
            getSampleLegacyModule()
              ?.getValueWithPromise(true)
              .then(() => {})
              .catch(e => this._setResult('rejectPromise', e.message)),
          getConstants: () => getSampleLegacyModule()?.getConstants(),
          getConst1: () => getSampleLegacyModule()?.const1,
          getConst2: () => getSampleLegacyModule()?.const2,
          getConst3: () => getSampleLegacyModule()?.const3,
        }
      : {
          voidFunc: () => getSampleLegacyModule()?.voidFunc(),
          getBool: () => getSampleLegacyModule()?.getBool(true),
          getEnum: () => getSampleLegacyModule()?.getEnum(1.0),
          getDouble: () => getSampleLegacyModule()?.getDouble(99.95),
          getInt: () => getSampleLegacyModule()?.getInt(99),
          getFloat: () => getSampleLegacyModule()?.getFloat(99.95),
          getObjectDouble: () =>
            getSampleLegacyModule()?.getObjectDouble(99.95),
          getObjectInteger: () => getSampleLegacyModule()?.getObjectInteger(99),
          getObjectFloat: () => getSampleLegacyModule()?.getObjectFloat(99.95),
          getString: () => getSampleLegacyModule()?.getString('Hello'),
          getRootTag: () => getSampleLegacyModule()?.getRootTag(11),
          getObject: () =>
            getSampleLegacyModule()?.getObject({a: 1, b: 'foo', c: null}),
          getUnsafeObject: () =>
            getSampleLegacyModule()?.getObject({a: 1, b: 'foo', c: null}),
          getValue: () =>
            getSampleLegacyModule()?.getValue(5, 'test', {a: 1, b: 'foo'}),
          callback: () =>
            getSampleLegacyModule()?.getValueWithCallback(callbackValue =>
              this._setResult('callback', callbackValue),
            ),
          getArray: () =>
            getSampleLegacyModule()?.getArray([
              {a: 1, b: 'foo'},
              {a: 2, b: 'bar'},
              null,
            ]),
          promise: () =>
            getSampleLegacyModule()
              ?.getValueWithPromise(false)
              .then(valuePromise => this._setResult('promise', valuePromise)),
          rejectPromise: () =>
            getSampleLegacyModule()
              ?.getValueWithPromise(true)
              .then(() => {})
              .catch(e => this._setResult('rejectPromise', e.message)),
          getConstants: () => getSampleLegacyModule()?.getConstants(),
          getConst1: () => getSampleLegacyModule()?.const1,
          getConst2: () => getSampleLegacyModule()?.const2,
          getConst3: () => getSampleLegacyModule()?.const3,
        };

  _setResult(name: string, result: mixed) {
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
        <Text testID={name + '-result'} style={[styles.value]}>
          {stringify(result.value)}
        </Text>
        <Text style={[styles.type]}>{result.type}</Text>
      </View>
    );
  }

  _getContent(): React.Node {
    if (getSampleLegacyModule() == null) {
      return null;
    }

    return (
      <>
        <View style={styles.item}>
          <TouchableOpacity
            style={[styles.column, styles.button]}
            testID="run-all-tests"
            onPress={() =>
              Object.keys(this._tests).forEach(item => {
                try {
                  this._setResult(item, this._tests[item]());
                } catch (ex) {
                  this._setResult(item, 'Fail: ' + ex.message);
                }
              })
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
      </>
    );
  }

  render(): React.Node {
    return <View style={styles.container}>{this._getContent()}</View>;
  }
}

export default SampleLegacyModuleExample;
