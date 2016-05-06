/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.unmock('MessageQueue')
  .unmock('fbjs/lib/keyMirror');
var MessageQueue = require('MessageQueue');

let MODULE_IDS = 0;
let METHOD_IDS = 1;
let PARAMS = 2;

let TestModule = {
  testHook1(){}, testHook2(){},
};

let assertQueue = (flushedQueue, index, moduleID, methodID, params) => {
  expect(flushedQueue[MODULE_IDS][index]).toEqual(moduleID);
  expect(flushedQueue[METHOD_IDS][index]).toEqual(methodID);
  expect(flushedQueue[PARAMS][index]).toEqual(params);
};

var queue;

describe('MessageQueue', () => {

  beforeEach(() => {
    queue = new MessageQueue(
      () => ({ remoteModuleConfig: remoteModulesConfig })
    );

    queue.registerCallableModule('one', TestModule);

    TestModule.testHook1 = jasmine.createSpy();
    TestModule.testHook2 = jasmine.createSpy();
  });

  it('should enqueue native calls', () => {
    queue.__nativeCall(0, 1, [2]);
    let flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 1, [2]);
  });

  it('should call a local function with the function name', () => {
    expect(TestModule.testHook2.calls.count()).toEqual(0);
    queue.__callFunction('one', 'testHook2', [2]);
    expect(TestModule.testHook2.calls.count()).toEqual(1);
  });

  it('should generate native modules', () => {
    queue.RemoteModules.one.remoteMethod1('foo');
    let flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 0, ['foo']);
  });

  it('should store callbacks', () => {
    queue.RemoteModules.one.remoteMethod2('foo', () => {}, () => {});
    let flushedQueue = queue.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 1, ['foo', 0, 1]);
  });

  it('should call the stored callback', () => {
    var done = false;
    queue.RemoteModules.one.remoteMethod1(() => { done = true; });
    queue.__invokeCallback(1);
    expect(done).toEqual(true);
  });

  it('should throw when calling the same callback twice', () => {
    queue.RemoteModules.one.remoteMethod1(() => {});
    queue.__invokeCallback(1);
    expect(() => queue.__invokeCallback(1)).toThrow();
  });

  it('should throw when calling both success and failure callback', () => {
    queue.RemoteModules.one.remoteMethod1(() => {}, () => {});
    queue.__invokeCallback(1);
    expect(() => queue.__invokeCallback(0)).toThrow();
  });
});

var remoteModulesConfig = {
  'one': {
    'moduleID':0,
    'methods': {
      'remoteMethod1':{ 'type': 'remote', 'methodID': 0 },
      'remoteMethod2':{ 'type': 'remote', 'methodID': 1 },
    }
  },
};

var localModulesConfig = {
  'one': {
    'moduleID': 0,
    'methods': {
      'testHook1':{ 'type': 'local', 'methodID': 0 },
      'testHook2':{ 'type': 'local', 'methodID': 1 },
    }
  },
};
