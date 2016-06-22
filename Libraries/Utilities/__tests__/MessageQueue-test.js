/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

const MessageQueueTestConfig = require('./MessageQueueTestConfig');
jest.unmock('MessageQueue');

let MessageQueue;
let MessageQueueTestModule1;
let MessageQueueTestModule2;
let queue;

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;

const assertQueue = (flushedQueue, index, moduleID, methodID, params) => {
  expect(flushedQueue[MODULE_IDS][index]).toEqual(moduleID);
  expect(flushedQueue[METHOD_IDS][index]).toEqual(methodID);
  expect(flushedQueue[PARAMS][index]).toEqual(params);
};

// Important things to test:
//
// [x] Calling remote method on queue actually queues it up.
//
// [x] Both error and success callbacks are invoked.
//
// [x] When simulating an error callback from remote method, both error and
// success callbacks are cleaned up.
//
// [x] Local modules can be invoked through the queue.
//
// [ ] Local modules that throw exceptions are gracefully caught. In that case
// local callbacks stored by IDs are cleaned up.
//
// [ ] Remote invocation throws if not supplying an error callback.
describe('MessageQueue', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();
    MessageQueue = require('MessageQueue');
    MessageQueueTestModule1 = require('./MessageQueueTestModule1');
    MessageQueueTestModule2 = require('./MessageQueueTestModule2');
    queue = new MessageQueue(
      () => MessageQueueTestConfig
    );

    queue.registerCallableModule(
      'MessageQueueTestModule1',
      MessageQueueTestModule1
    );
    queue.registerCallableModule(
      'MessageQueueTestModule2',
      MessageQueueTestModule2
    );
  });

  it('should enqueue native calls', () => {
    queue.__nativeCall(0, 1, [2]);
    let flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 1, [2]);
  });

  it('should call a local function with the function name', () => {
    MessageQueueTestModule1.testHook2 = jasmine.createSpy();
    expect(MessageQueueTestModule1.testHook2.calls.count()).toEqual(0);
    queue.__callFunction('MessageQueueTestModule1', 'testHook2', [2]);
    expect(MessageQueueTestModule1.testHook2.calls.count()).toEqual(1);
  });

  it('should generate native modules', () => {
    queue.RemoteModules.RemoteModule1.remoteMethod1('foo');
    let flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 0, ['foo']);
  });

  it('should store callbacks', () => {
    queue.RemoteModules.RemoteModule1.remoteMethod2('foo', () => {}, () => {});
    let flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 1, ['foo', 0, 1]);
  });

  it('should call the stored callback', () => {
    var done = false;
    queue.RemoteModules.RemoteModule1.remoteMethod1(() => { done = true; });
    queue.__invokeCallback(1);
    expect(done).toEqual(true);
  });

  it('should throw when calling the same callback twice', () => {
    queue.RemoteModules.RemoteModule1.remoteMethod1(() => {});
    queue.__invokeCallback(1);
    expect(() => queue.__invokeCallback(1)).toThrow();
  });

  it('should throw when calling both success and failure callback', () => {
    queue.RemoteModules.RemoteModule1.remoteMethod1(() => {}, () => {});
    queue.__invokeCallback(1);
    expect(() => queue.__invokeCallback(0)).toThrow();
  });

  it('should make round trip and clear memory', function() {
    // Perform communication

    // First we're going to call into this (overriden) test hook pretending to
    // be a remote module making a "local" invocation into JS.
    let onFail = jasmine.createSpy();
    let onSucc = jasmine.createSpy();
    MessageQueueTestModule1.testHook1 = function() {
      // Then inside of this local module, we're going to fire off a remote
      // request.
      queue.__nativeCall(
        0,
        0,
        Array.prototype.slice.apply(arguments),
        onFail,
        onSucc,
      );
    };

    // The second test hook does the same thing as the first, but fires off a
    // remote request to a different remote module/method.
    MessageQueueTestModule1.testHook2 = function() {
      queue.__nativeCall(
        1,
        1,
        Array.prototype.slice.apply(arguments),
        onFail,
        onSucc,
      );
    };

    /* MessageQueueTestModule1.testHook1 */
    queue.__callFunction('MessageQueueTestModule1', 'testHook1', ['paloAlto', 'menloPark']);
    /* MessageQueueTestModule1.testHook2 */
    queue.__callFunction('MessageQueueTestModule1', 'testHook2', ['mac', 'windows']);

    // And how do we know that it executed those local modules correctly? Well,
    // these particular test method echo their arguments back to remote methods!

    var resultingRemoteInvocations = queue.flushedQueue();
    // As always, the message queue has five fields
    expect(resultingRemoteInvocations.length).toBe(4);
    expect(resultingRemoteInvocations[0].length).toBe(2);
    expect(resultingRemoteInvocations[1].length).toBe(2);
    expect(resultingRemoteInvocations[2].length).toBe(2);
    expect(typeof resultingRemoteInvocations[3]).toEqual('number');

    expect(resultingRemoteInvocations[0][0]).toBe(0); // `RemoteModule1`
    expect(resultingRemoteInvocations[1][0]).toBe(0); // `remoteMethod1`
    expect([                                          // the arguments
      resultingRemoteInvocations[2][0][0],
      resultingRemoteInvocations[2][0][1]
    ]).toEqual(['paloAlto', 'menloPark']);
    // Callbacks ids are tacked onto the end of the remote arguments.
    var firstFailCBID = resultingRemoteInvocations[2][0][2];
    var firstSuccCBID = resultingRemoteInvocations[2][0][3];

    expect(resultingRemoteInvocations[0][1]).toBe(1); // `RemoteModule2`
    expect(resultingRemoteInvocations[1][1]).toBe(1); // `remoteMethod2`
    expect([                                          // the arguments
      resultingRemoteInvocations[2][1][0],
      resultingRemoteInvocations[2][1][1]
    ]).toEqual(['mac', 'windows']);
    var secondFailCBID = resultingRemoteInvocations[2][1][2];
    var secondSuccCBID = resultingRemoteInvocations[2][1][3];

    // Trigger init
    queue.RemoteModules
    // Handle the first remote invocation by signaling failure.
    // -------------------------------------------------------
    queue.__invokeCallback(firstFailCBID, ['firstFailure']);
    // The failure callback was already invoked, the success is no longer valid
    expect(function() {
      queue.__invokeCallback(firstSuccCBID, ['firstSucc']);
    }).toThrow();
    expect(onFail.calls.count()).toBe(1);
    expect(onSucc.calls.count()).toBe(0);

    // Handle the second remote invocation by signaling success.
    // -------------------------------------------------------
    queue.__invokeCallback(secondSuccCBID, ['secondSucc']);
    // The success callback was already invoked, the fail cb is no longer valid
    expect(function() {
      queue.__invokeCallback(secondFailCBID, ['secondFail']);
    }).toThrow();
    expect(onFail.calls.count()).toBe(1);
    expect(onSucc.calls.count()).toBe(1);
  });
});
