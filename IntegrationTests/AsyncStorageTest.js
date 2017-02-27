/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule AsyncStorageTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AsyncStorage,
  Text,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

var deepDiffer = require('deepDiffer');

var DEBUG = false;

var KEY_1 = 'key_1';
var VAL_1 = 'val_1';
var KEY_2 = 'key_2';
var VAL_2 = 'val_2';
var KEY_MERGE = 'key_merge';
var VAL_MERGE_1 = {'foo': 1, 'bar': {'hoo': 1, 'boo': 1}, 'moo': {'a': 3}};
var VAL_MERGE_2 = {'bar': {'hoo': 2}, 'baz': 2, 'moo': {'a': 3}};
var VAL_MERGE_EXPECT =
  {'foo': 1, 'bar': {'hoo': 2, 'boo': 1}, 'baz': 2, 'moo': {'a': 3}};

// setup in componentDidMount
var done = (result : ?boolean) => {};
var updateMessage = (message : string ) => {};

function runTestCase(description : string, fn) {
  updateMessage(description);
  fn();
}

function expectTrue(condition : boolean, message : string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectEqual(lhs, rhs, testname : string) {
  expectTrue(
    !deepDiffer(lhs, rhs),
    'Error in test ' + testname + ': expected\n' + JSON.stringify(rhs) +
      '\ngot\n' + JSON.stringify(lhs)
  );
}

function expectAsyncNoError(place, err) {
  if (err instanceof Error) {
    err = err.message;
  }
  expectTrue(err === null, 'Unexpected error in ' + place + ': ' + JSON.stringify(err));
}

function testSetAndGet() {
  AsyncStorage.setItem(KEY_1, VAL_1, (err1) => {
    expectAsyncNoError('testSetAndGet/setItem', err1);
    AsyncStorage.getItem(KEY_1, (err2, result) => {
      expectAsyncNoError('testSetAndGet/getItem', err2);
      expectEqual(result, VAL_1, 'testSetAndGet setItem');
      updateMessage('get(key_1) correctly returned ' + result);
      runTestCase('should get null for missing key', testMissingGet);
    });
  });
}

function testMissingGet() {
  AsyncStorage.getItem(KEY_2, (err, result) => {
    expectAsyncNoError('testMissingGet/setItem', err);
    expectEqual(result, null, 'testMissingGet');
    updateMessage('missing get(key_2) correctly returned ' + result);
    runTestCase('check set twice results in a single key', testSetTwice);
  });
}

function testSetTwice() {
  AsyncStorage.setItem(KEY_1, VAL_1, ()=>{
    AsyncStorage.setItem(KEY_1, VAL_1, ()=>{
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
  AsyncStorage.setItem(KEY_1, VAL_1, ()=>{
    AsyncStorage.setItem(KEY_2, VAL_2, ()=>{
      AsyncStorage.getAllKeys((err, result) => {
        expectAsyncNoError('testRemoveItem/getAllKeys', err);
        expectTrue(
          result.indexOf(KEY_1) >= 0 && result.indexOf(KEY_2) >= 0,
          'Missing KEY_1 or KEY_2 in ' + '(' + result + ')'
        );
        updateMessage('testRemoveItem - add two items');
        AsyncStorage.removeItem(KEY_1, (err2) => {
          expectAsyncNoError('testRemoveItem/removeItem', err2);
          updateMessage('delete successful ');
          AsyncStorage.getItem(KEY_1, (err3, result2) => {
            expectAsyncNoError('testRemoveItem/getItem', err3);
            expectEqual(
              result2,
              null,
              'testRemoveItem: key_1 present after delete'
            );
            updateMessage('key properly removed ');
            AsyncStorage.getAllKeys((err4, result3) => {
             expectAsyncNoError('testRemoveItem/getAllKeys', err4);
             expectTrue(
               result3.indexOf(KEY_1) === -1,
               'Unexpected: KEY_1 present in ' + result3
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
  AsyncStorage.setItem(KEY_MERGE, JSON.stringify(VAL_MERGE_1), (err1) => {
    expectAsyncNoError('testMerge/setItem', err1);
    AsyncStorage.mergeItem(KEY_MERGE, JSON.stringify(VAL_MERGE_2), (err2) => {
      expectAsyncNoError('testMerge/mergeItem', err2);
      AsyncStorage.getItem(KEY_MERGE, (err3, result) => {
        expectAsyncNoError('testMerge/setItem', err3);
        expectEqual(JSON.parse(result), VAL_MERGE_EXPECT, 'testMerge');
        updateMessage('objects deeply merged\nDone!');
        runTestCase('multi set and get', testOptimizedMultiGet);
      });
    });
  });
}

function testOptimizedMultiGet() {
  let batch = [[KEY_1, VAL_1], [KEY_2, VAL_2]];
  let keys = batch.map(([key, value]) => key);
  AsyncStorage.multiSet(batch, (err1) => {
    // yes, twice on purpose
    ;[1, 2].forEach((i) => {
      expectAsyncNoError(`${i} testOptimizedMultiGet/multiSet`, err1);
      AsyncStorage.multiGet(keys, (err2, result) => {
        expectAsyncNoError(`${i} testOptimizedMultiGet/multiGet`, err2);
        expectEqual(result, batch, `${i} testOptimizedMultiGet multiGet`);
        updateMessage('multiGet([key_1, key_2]) correctly returned ' + JSON.stringify(result));
        done();
      });
    });
  });
}


class AsyncStorageTest extends React.Component {
  state = {
    messages: 'Initializing...',
    done: false,
  };

  componentDidMount() {
    done = () => this.setState({done: true}, () => {
      TestModule.markTestCompleted();
    });
    updateMessage = (msg) => {
      this.setState({messages: this.state.messages.concat('\n' + msg)});
      DEBUG && console.log(msg);
    };
    AsyncStorage.clear(testSetAndGet);
  }

  render() {
    return (
      <View style={{backgroundColor: 'white', padding: 40}}>
        <Text>
          {this.constructor.displayName + ': '}
          {this.state.done ? 'Done' : 'Testing...'}
          {'\n\n' + this.state.messages}
        </Text>
      </View>
    );
  }
}

AsyncStorageTest.displayName = 'AsyncStorageTest';

module.exports = AsyncStorageTest;
