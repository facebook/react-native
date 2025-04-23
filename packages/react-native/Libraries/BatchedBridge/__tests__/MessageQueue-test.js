/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

let MessageQueue;
let MessageQueueTestModule;
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
// [x] Local modules can be invoked through the queue.
//
// [ ] Local modules that throw exceptions are gracefully caught. In that case
// local callbacks stored by IDs are cleaned up.
describe('MessageQueue', function () {
  beforeEach(function () {
    jest.resetModules();
    MessageQueue = require('../MessageQueue').default;
    MessageQueueTestModule = require('../__mocks__/MessageQueueTestModule');
    queue = new MessageQueue();
    queue.registerCallableModule(
      'MessageQueueTestModule',
      MessageQueueTestModule,
    );
    queue.createDebugLookup(0, 'MessageQueueTestModule', [
      'testHook1',
      'testHook2',
    ]);
  });

  it('should enqueue native calls', () => {
    queue.enqueueNativeCall(0, 1, [2]);
    const flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 1, [2]);
  });

  it('should call a local function with the function name', () => {
    MessageQueueTestModule.testHook2 = jest.fn();
    expect(MessageQueueTestModule.testHook2.mock.calls.length).toEqual(0);
    queue.__callFunction('MessageQueueTestModule', 'testHook2', [2]);
    expect(MessageQueueTestModule.testHook2.mock.calls.length).toEqual(1);
  });

  it('should store callbacks', () => {
    queue.enqueueNativeCall(0, 1, ['foo'], null, null);
    const flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 1, ['foo']);
  });

  it('should call the stored callback', () => {
    let done = false;
    queue.enqueueNativeCall(
      0,
      1,
      [],
      () => {},
      () => {
        done = true;
      },
    );
    queue.__invokeCallback(1, []);
    expect(done).toEqual(true);
  });

  it('should throw when calling the same callback twice', () => {
    queue.enqueueNativeCall(
      0,
      1,
      [],
      () => {},
      () => {},
    );
    queue.__invokeCallback(1, []);
    expect(() => queue.__invokeCallback(1, [])).toThrow();
  });

  it('should throw when calling both success and failure callback', () => {
    queue.enqueueNativeCall(
      0,
      1,
      [],
      () => {},
      () => {},
    );
    queue.__invokeCallback(1, []);
    expect(() => queue.__invokeCallback(0, [])).toThrow();
  });

  it('should throw when calling with unknown module', () => {
    const unknownModule = 'UnknownModule',
      unknownMethod = 'UnknownMethod';
    expect(() => queue.__callFunction(unknownModule, unknownMethod)).toThrow(
      `Failed to call into JavaScript module method ${unknownModule}.${unknownMethod}()`,
    );
  });

  it('should return lazily registered module', () => {
    const dummyModule = {},
      name = 'modulesName';
    queue.registerLazyCallableModule(name, () => dummyModule);

    expect(queue.getCallableModule(name)).toEqual(dummyModule);
  });

  it('should not initialize lazily registered module before it was used for the first time', () => {
    const dummyModule = {},
      name = 'modulesName';
    const factory = jest.fn(() => dummyModule);
    queue.registerLazyCallableModule(name, factory);
    expect(factory).not.toHaveBeenCalled();
  });

  it('should initialize lazily registered module only once', () => {
    const dummyModule = {},
      name = 'modulesName';
    const factory = jest.fn(() => dummyModule);
    queue.registerLazyCallableModule(name, factory);
    queue.getCallableModule(name);
    queue.getCallableModule(name);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should check if the global error handler is not overridden by the DebuggerInternal object', () => {
    const dummyModule = {
      dummy: function () {},
    };
    const name = 'emptyModuleName';
    const factory = jest.fn(() => dummyModule);
    queue.__shouldPauseOnThrow = jest.fn(() => false);
    queue.registerLazyCallableModule(name, factory);
    queue.callFunctionReturnFlushedQueue(name, 'dummy', []);
    expect(queue.__shouldPauseOnThrow).toHaveBeenCalledTimes(2);
  });

  it('should check if the global error handler is overridden by the DebuggerInternal object', () => {
    const dummyModule = {
      dummy: function () {},
    };
    const name = 'emptyModuleName';
    const factory = jest.fn(() => dummyModule);
    queue.__shouldPauseOnThrow = jest.fn(() => true);
    queue.registerLazyCallableModule(name, factory);
    queue.callFunctionReturnFlushedQueue(name, 'dummy', []);
    expect(queue.__shouldPauseOnThrow).toHaveBeenCalledTimes(2);
  });
});
