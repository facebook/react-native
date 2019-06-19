/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

jest.unmock('../NativeModules');

let BatchedBridge;
let NativeModules;
let fs;
let parseErrorStack;

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;
const CALL_ID = 3;

const assertQueue = (flushedQueue, index, moduleID, methodID, params) => {
  expect(flushedQueue[MODULE_IDS][index]).toEqual(moduleID);
  expect(flushedQueue[METHOD_IDS][index]).toEqual(methodID);
  expect(flushedQueue[PARAMS][index]).toEqual(params);
};

// Important things to test:
//
// [x] Calling remote method actually queues it up on the BatchedBridge
//
// [x] Both error and success callbacks are invoked.
//
// [x] When simulating an error callback from remote method, both error and
// success callbacks are cleaned up.
//
// [ ] Remote invocation throws if not supplying an error callback.
describe('MessageQueue', function() {
  beforeEach(function() {
    jest.resetModules();

    global.__fbBatchedBridgeConfig = require('../__mocks__/MessageQueueTestConfig');
    BatchedBridge = require('../BatchedBridge');
    NativeModules = require('../NativeModules');
    fs = require('fs');
    parseErrorStack = require('../../Core/Devtools/parseErrorStack');
  });

  it('should generate native modules', () => {
    NativeModules.RemoteModule1.remoteMethod('foo');
    const flushedQueue = BatchedBridge.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 0, ['foo']);
  });

  it('should make round trip and clear memory', function() {
    const onFail = jest.fn();
    const onSucc = jest.fn();

    // Perform communication
    NativeModules.RemoteModule1.promiseMethod(
      'paloAlto',
      'menloPark',
      onFail,
      onSucc,
    );
    NativeModules.RemoteModule2.promiseMethod('mac', 'windows', onFail, onSucc);

    const resultingRemoteInvocations = BatchedBridge.flushedQueue();

    // As always, the message queue has four fields
    expect(resultingRemoteInvocations.length).toBe(4);
    expect(resultingRemoteInvocations[MODULE_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[METHOD_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[PARAMS].length).toBe(2);
    expect(typeof resultingRemoteInvocations[CALL_ID]).toEqual('number');

    expect(resultingRemoteInvocations[0][0]).toBe(0); // `RemoteModule1`
    expect(resultingRemoteInvocations[1][0]).toBe(1); // `promiseMethod`
    expect([
      // the arguments
      resultingRemoteInvocations[2][0][0],
      resultingRemoteInvocations[2][0][1],
    ]).toEqual(['paloAlto', 'menloPark']);
    // Callbacks ids are tacked onto the end of the remote arguments.
    const firstFailCBID = resultingRemoteInvocations[2][0][2];
    const firstSuccCBID = resultingRemoteInvocations[2][0][3];

    expect(resultingRemoteInvocations[0][1]).toBe(1); // `RemoteModule2`
    expect(resultingRemoteInvocations[1][1]).toBe(1); // `promiseMethod`
    expect([
      // the arguments
      resultingRemoteInvocations[2][1][0],
      resultingRemoteInvocations[2][1][1],
    ]).toEqual(['mac', 'windows']);
    const secondFailCBID = resultingRemoteInvocations[2][1][2];
    const secondSuccCBID = resultingRemoteInvocations[2][1][3];

    // Handle the first remote invocation by signaling failure.
    BatchedBridge.__invokeCallback(firstFailCBID, ['firstFailure']);
    // The failure callback was already invoked, the success is no longer valid
    expect(function() {
      BatchedBridge.__invokeCallback(firstSuccCBID, ['firstSucc']);
    }).toThrow();
    expect(onFail.mock.calls.length).toBe(1);
    expect(onSucc.mock.calls.length).toBe(0);

    // Handle the second remote invocation by signaling success.
    BatchedBridge.__invokeCallback(secondSuccCBID, ['secondSucc']);
    // The success callback was already invoked, the fail cb is no longer valid
    expect(function() {
      BatchedBridge.__invokeCallback(secondFailCBID, ['secondFail']);
    }).toThrow();
    expect(onFail.mock.calls.length).toBe(1);
    expect(onSucc.mock.calls.length).toBe(1);
  });

  it('promise-returning methods (type=promise)', async function() {
    // Perform communication
    const promise1 = NativeModules.RemoteModule1.promiseReturningMethod(
      'paloAlto',
      'menloPark',
    );
    const promise2 = NativeModules.RemoteModule2.promiseReturningMethod(
      'mac',
      'windows',
    );

    const resultingRemoteInvocations = BatchedBridge.flushedQueue();

    // As always, the message queue has four fields
    expect(resultingRemoteInvocations.length).toBe(4);
    expect(resultingRemoteInvocations[MODULE_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[METHOD_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[PARAMS].length).toBe(2);
    expect(typeof resultingRemoteInvocations[CALL_ID]).toEqual('number');

    expect(resultingRemoteInvocations[0][0]).toBe(0); // `RemoteModule1`
    expect(resultingRemoteInvocations[1][0]).toBe(2); // `promiseReturningMethod`
    expect([
      // the arguments
      resultingRemoteInvocations[2][0][0],
      resultingRemoteInvocations[2][0][1],
    ]).toEqual(['paloAlto', 'menloPark']);
    // For promise-returning methods, the order of callbacks is flipped from
    // regular async methods.
    const firstSuccCBID = resultingRemoteInvocations[2][0][2];
    const firstFailCBID = resultingRemoteInvocations[2][0][3];

    expect(resultingRemoteInvocations[0][1]).toBe(1); // `RemoteModule2`
    expect(resultingRemoteInvocations[1][1]).toBe(2); // `promiseReturningMethod`
    expect([
      // the arguments
      resultingRemoteInvocations[2][1][0],
      resultingRemoteInvocations[2][1][1],
    ]).toEqual(['mac', 'windows']);
    const secondSuccCBID = resultingRemoteInvocations[2][1][2];
    const secondFailCBID = resultingRemoteInvocations[2][1][3];

    // Handle the first remote invocation by signaling failure.
    BatchedBridge.__invokeCallback(firstFailCBID, [{message: 'firstFailure'}]);
    // The failure callback was already invoked, the success is no longer valid
    expect(function() {
      BatchedBridge.__invokeCallback(firstSuccCBID, ['firstSucc']);
    }).toThrow();
    await expect(promise1).rejects.toBeInstanceOf(Error);
    await expect(promise1).rejects.toMatchObject({message: 'firstFailure'});
    // Check that we get a useful stack trace from failures.
    const error = await promise1.catch(x => x);
    expect(getLineFromFrame(parseErrorStack(error)[0])).toContain(
      'NativeModules.RemoteModule1.promiseReturningMethod(',
    );

    // Handle the second remote invocation by signaling success.
    BatchedBridge.__invokeCallback(secondSuccCBID, ['secondSucc']);
    // The success callback was already invoked, the fail cb is no longer valid
    expect(function() {
      BatchedBridge.__invokeCallback(secondFailCBID, ['secondFail']);
    }).toThrow();
    await promise2;
  });

  describe('sync methods', () => {
    afterEach(function() {
      delete global.nativeCallSyncHook;
    });

    it('throwing an exception', function() {
      global.nativeCallSyncHook = jest.fn(() => {
        throw new Error('firstFailure');
      });

      let error;
      try {
        NativeModules.RemoteModule1.syncMethod('paloAlto', 'menloPark');
      } catch (e) {
        error = e;
      }

      expect(global.nativeCallSyncHook).toBeCalledTimes(1);
      expect(global.nativeCallSyncHook).toBeCalledWith(
        0, // `RemoteModule1`
        3, // `syncMethod`
        ['paloAlto', 'menloPark'],
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({
        message: 'firstFailure',
      });
    });

    it('throwing a "native" exception gets framesToPop = 2', function() {
      global.nativeCallSyncHook = () => {
        throw new Error('Exception in HostFunction: foo');
      };
      let error;
      try {
        NativeModules.RemoteModule1.syncMethod('paloAlto', 'menloPark');
      } catch (e) {
        error = e;
      }
      // We can't test this behaviour with `getLineFromFrame` because our mock
      // function adds an extra frame, so check `framesToPop` directly instead.
      expect(error.framesToPop).toBe(2);
    });

    it('throwing a "native" exception preserves framesToPop if set', function() {
      global.nativeCallSyncHook = () => {
        const e = new Error('Exception in HostFunction: foo');
        e.framesToPop = 42;
        throw e;
      };
      let error;
      try {
        NativeModules.RemoteModule1.syncMethod('paloAlto', 'menloPark');
      } catch (e) {
        error = e;
      }
      expect(error.framesToPop).toBe(42);
    });

    it('returning a value', function() {
      global.nativeCallSyncHook = jest.fn(() => {
        return 'secondSucc';
      });

      const result = NativeModules.RemoteModule2.syncMethod('mac', 'windows');

      expect(global.nativeCallSyncHook).toBeCalledTimes(1);
      expect(global.nativeCallSyncHook).toBeCalledWith(
        1, // `RemoteModule2`
        3, // `syncMethod`
        ['mac', 'windows'],
      );

      expect(result).toBe('secondSucc');
    });
  });
});

const linesByFile = new Map();

function getLineFromFrame({lineNumber /* 1-based */, file}) {
  const cleanedFile = cleanFileName(file);
  const lines =
    linesByFile.get(cleanedFile) ||
    fs.readFileSync(cleanedFile, 'utf8').split('\n');
  if (!linesByFile.has(cleanedFile)) {
    linesByFile.set(cleanedFile, lines);
  }
  return (lines[lineNumber - 1] || '').trim();
}

// Works around a parseErrorStack bug involving `new X` stack frames.
function cleanFileName(file) {
  return file.replace(/^.+? \((?=\/)/, '');
}
