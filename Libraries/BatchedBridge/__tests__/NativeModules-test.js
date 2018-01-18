/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+react_native
 */
'use strict';

jest
  .enableAutomock()
  .unmock('BatchedBridge')
  .unmock('defineLazyObjectProperty')
  .unmock('MessageQueue')
  .unmock('NativeModules');

let BatchedBridge;
let NativeModules;

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

    global.__fbBatchedBridgeConfig = require('MessageQueueTestConfig');
    BatchedBridge = require('BatchedBridge');
    NativeModules = require('NativeModules');
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
    NativeModules.RemoteModule1.promiseMethod('paloAlto', 'menloPark', onFail, onSucc);
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
    expect([                                          // the arguments
      resultingRemoteInvocations[2][0][0],
      resultingRemoteInvocations[2][0][1]
    ]).toEqual(['paloAlto', 'menloPark']);
    // Callbacks ids are tacked onto the end of the remote arguments.
    const firstFailCBID = resultingRemoteInvocations[2][0][2];
    const firstSuccCBID = resultingRemoteInvocations[2][0][3];

    expect(resultingRemoteInvocations[0][1]).toBe(1); // `RemoteModule2`
    expect(resultingRemoteInvocations[1][1]).toBe(1); // `promiseMethod`
    expect([                                          // the arguments
      resultingRemoteInvocations[2][1][0],
      resultingRemoteInvocations[2][1][1]
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
});
