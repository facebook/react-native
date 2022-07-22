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
const {AsyncStorage, Text, View, StyleSheet} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

const deepDiffer = require('react-native/Libraries/Utilities/differ/deepDiffer');
const nullthrows = require('nullthrows');

const DEBUG = false;

const KEY_1 = 'key_1';
const VAL_1 = 'val_1';
const KEY_2 = 'key_2';
const VAL_2 = 'val_2';
const KEY_MERGE = 'key_merge';
const VAL_MERGE_1 = {foo: 1, bar: {hoo: 1, boo: 1}, moo: {a: 3}};
const VAL_MERGE_2 = {bar: {hoo: 2}, baz: 2, moo: {a: 3}};
const VAL_MERGE_EXPECT = {foo: 1, bar: {hoo: 2, boo: 1}, baz: 2, moo: {a: 3}};

// setup in componentDidMount
let done = (result: ?boolean) => {};
let updateMessage = (message: string) => {};

function runTestCase(description: string, fn: () => void) {
  updateMessage(description);
  fn();
}

function expectTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Type-safe wrapper around JSON.stringify
function stringify(
  value:
    | void
    | null
    | string
    | number
    | boolean
    | {...}
    | $ReadOnlyArray<mixed>,
): string {
  if (typeof value === 'undefined') {
    return 'undefined';
  }
  return JSON.stringify(value);
}

function expectEqual(
  lhs: ?(any | string | Array<Array<string>>),
  rhs:
    | null
    | string
    | {
        bar: {boo: number, hoo: number},
        baz: number,
        foo: number,
        moo: {a: number},
      }
    | Array<Array<string>>,
  testname: string,
) {
  expectTrue(
    !deepDiffer(lhs, rhs),
    'Error in test ' +
      testname +
      ': expected\n' +
      stringify(rhs) +
      '\ngot\n' +
      stringify(lhs),
  );
}

function expectAsyncNoError(
  place: string,
  err: ?(Error | string | Array<Error>),
) {
  if (err instanceof Error) {
    err = err.message;
  }
  expectTrue(
    err === null,
    'Unexpected error in ' + place + ': ' + stringify(err),
  );
}

function testSetAndGet() {
  AsyncStorage.setItem(KEY_1, VAL_1, err1 => {
    expectAsyncNoError('testSetAndGet/setItem', err1);
    AsyncStorage.getItem(KEY_1, (err2, result) => {
      expectAsyncNoError('testSetAndGet/getItem', err2);
      expectEqual(result, VAL_1, 'testSetAndGet setItem');
      updateMessage('get(key_1) correctly returned ' + String(result));
      runTestCase('should get null for missing key', testMissingGet);
    });
  });
}

function testMissingGet() {
  AsyncStorage.getItem(KEY_2, (err, result) => {
    expectAsyncNoError('testMissingGet/setItem', err);
    expectEqual(result, null, 'testMissingGet');
    updateMessage('missing get(key_2) correctly returned ' + String(result));
    runTestCase('check set twice results in a single key', testSetTwice);
  });
}

function testSetTwice() {
  AsyncStorage.setItem(KEY_1, VAL_1, () => {
    AsyncStorage.setItem(KEY_1, VAL_1, () => {
      AsyncStorage.getItem(KEY_1, (err, result) => {
        expectAsyncNoError('testSetTwice/setItem', err);
        expectEqual(result, VAL_1, 'testSetTwice');
        updateMessage('setTwice worked as expected');
        runTestCase('test removeItem', testRemoveItem);
      });
    });
  });
}

function testRemoveItem() {
  AsyncStorage.setItem(KEY_1, VAL_1, () => {
    AsyncStorage.setItem(KEY_2, VAL_2, () => {
      AsyncStorage.getAllKeys((err, result) => {
        expectAsyncNoError('testRemoveItem/getAllKeys', err);
        expectTrue(
          nullthrows(result).indexOf(KEY_1) >= 0 &&
            nullthrows(result).indexOf(KEY_2) >= 0,
          'Missing KEY_1 or KEY_2 in ' + '(' + nullthrows(result).join() + ')',
        );
        updateMessage('testRemoveItem - add two items');
        AsyncStorage.removeItem(KEY_1, err2 => {
          expectAsyncNoError('testRemoveItem/removeItem', err2);
          updateMessage('delete successful ');
          AsyncStorage.getItem(KEY_1, (err3, result2) => {
            expectAsyncNoError('testRemoveItem/getItem', err3);
            expectEqual(
              result2,
              null,
              'testRemoveItem: key_1 present after delete',
            );
            updateMessage('key properly removed ');
            AsyncStorage.getAllKeys((err4, result3) => {
              expectAsyncNoError('testRemoveItem/getAllKeys', err4);
              expectTrue(
                nullthrows(result3).indexOf(KEY_1) === -1,
                'Unexpected: KEY_1 present in ' + nullthrows(result3).join(),
              );
              updateMessage('proper length returned.');
              runTestCase('should merge values', testMerge);
            });
          });
        });
      });
    });
  });
}

function testMerge() {
  AsyncStorage.setItem(KEY_MERGE, stringify(VAL_MERGE_1), err1 => {
    expectAsyncNoError('testMerge/setItem', err1);
    AsyncStorage.mergeItem(KEY_MERGE, stringify(VAL_MERGE_2), err2 => {
      expectAsyncNoError('testMerge/mergeItem', err2);
      AsyncStorage.getItem(KEY_MERGE, (err3, result) => {
        expectAsyncNoError('testMerge/setItem', err3);
        expectEqual(
          JSON.parse(nullthrows(result)),
          VAL_MERGE_EXPECT,
          'testMerge',
        );
        updateMessage('objects deeply merged\nDone!');
        runTestCase('multi set and get', testOptimizedMultiGet);
      });
    });
  });
}

function testOptimizedMultiGet() {
  let batch = [
    [KEY_1, VAL_1],
    [KEY_2, VAL_2],
  ];
  let keys = batch.map(([key, value]) => key);
  AsyncStorage.multiSet(batch, err1 => {
    // yes, twice on purpose
    [1, 2].forEach(i => {
      expectAsyncNoError(`${i} testOptimizedMultiGet/multiSet`, err1);
      AsyncStorage.multiGet(keys, (err2, result) => {
        expectAsyncNoError(`${i} testOptimizedMultiGet/multiGet`, err2);
        expectEqual(result, batch, `${i} testOptimizedMultiGet multiGet`);
        updateMessage(
          'multiGet([key_1, key_2]) correctly returned ' + stringify(result),
        );
        done();
      });
    });
  });
}

class AsyncStorageTest extends React.Component<{...}, $FlowFixMeState> {
  state: any | {|done: boolean, messages: string|} = {
    messages: 'Initializing...',
    done: false,
  };

  componentDidMount() {
    done = () =>
      this.setState({done: true}, () => {
        TestModule.markTestCompleted();
      });
    updateMessage = (msg: string) => {
      this.setState({messages: this.state.messages.concat('\n' + msg)});
      DEBUG && console.log(msg);
    };
    AsyncStorage.clear(testSetAndGet);
  }

  render(): React.Node {
    return (
      <View style={styles.container}>
        <Text>
          {
            /* $FlowFixMe[incompatible-type] (>=0.54.0 site=react_native_fb,react_
             * native_oss) This comment suppresses an error found when Flow v0.54
             * was deployed. To see the error delete this comment and run Flow.
             */
            this.constructor.displayName + ': '
          }
          {this.state.done ? 'Done' : 'Testing...'}
          {'\n\n' + this.state.messages}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

AsyncStorageTest.displayName = 'AsyncStorageTest';

module.exports = AsyncStorageTest;
