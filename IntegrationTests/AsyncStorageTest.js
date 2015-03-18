/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var RCTTestModule = require('NativeModules').TestModule;
var React = require('react-native');
var {
  AsyncStorage,
  Text,
  View,
} = React;

var DEBUG = false;

var KEY_1 = 'key_1';
var VAL_1 = 'val_1';
var KEY_2 = 'key_2';
var VAL_2 = 'val_2';

// setup in componentDidMount
var done;
var updateMessage;

function runTestCase(description, fn) {
  updateMessage(description);
  fn();
}

function expectTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectEqual(lhs, rhs, testname) {
  expectTrue(
    lhs === rhs,
    'Error in test ' + testname + ': expected ' + rhs + ', got ' + lhs
  );
}

function expectAsyncNoError(err) {
  expectTrue(err === null, 'Unexpected Async error: ' + JSON.stringify(err));
}

function testSetAndGet() {
  AsyncStorage.setItem(KEY_1, VAL_1, (err1) => {
    expectAsyncNoError(err1);
    AsyncStorage.getItem(KEY_1, (err2, result) => {
      expectAsyncNoError(err2);
      expectEqual(result, VAL_1, 'testSetAndGet setItem');
      updateMessage('get(key_1) correctly returned ' + result);
      runTestCase('should get null for missing key', testMissingGet);
    });
  });
}

function testMissingGet() {
  AsyncStorage.getItem(KEY_2, (err, result) => {
    expectAsyncNoError(err);
    expectEqual(result, null, 'testMissingGet');
    updateMessage('missing get(key_2) correctly returned ' + result);
    runTestCase('check set twice results in a single key', testSetTwice);
  });
}

function testSetTwice() {
  AsyncStorage.setItem(KEY_1, VAL_1, ()=>{
    AsyncStorage.setItem(KEY_1, VAL_1, ()=>{
      AsyncStorage.getItem(KEY_1, (err, result) => {
        expectAsyncNoError(err);
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
        expectAsyncNoError(err);
        expectTrue(
          result.indexOf(KEY_1) >= 0 && result.indexOf(KEY_2) >= 0,
          'Missing KEY_1 or KEY_2 in ' + '(' + result + ')'
        );
        updateMessage('testRemoveItem - add two items');
        AsyncStorage.removeItem(KEY_1, (err) => {
          expectAsyncNoError(err);
          updateMessage('delete successful ');
          AsyncStorage.getItem(KEY_1, (err, result) => {
            expectAsyncNoError(err);
            expectEqual(
              result,
              null,
              'testRemoveItem: key_1 present after delete'
            );
            updateMessage('key properly removed ');
            AsyncStorage.getAllKeys((err, result2) => {
             expectAsyncNoError(err);
             expectTrue(
               result2.indexOf(KEY_1) === -1,
               'Unexpected: KEY_1 present in ' + result2
             );
             updateMessage('proper length returned.\nDone!');
             done();
            });
          });
        });
      });
    });
  });
}

var AsyncStorageTest = React.createClass({
  getInitialState() {
    return {
      messages: 'Initializing...',
      done: false,
    };
  },

  componentDidMount() {
    done = () => this.setState({done: true}, RCTTestModule.markTestCompleted);
    updateMessage = (msg) => {
      this.setState({messages: this.state.messages.concat('\n' + msg)});
      DEBUG && console.log(msg);
    };
    AsyncStorage.clear(testSetAndGet);
  },

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
});

module.exports = AsyncStorageTest;
