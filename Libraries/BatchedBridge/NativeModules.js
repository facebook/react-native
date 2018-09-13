/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const BatchedBridge = require('BatchedBridge');

const invariant = require('fbjs/lib/invariant');

import type {ExtendedError} from 'parseErrorStack';

type ModuleConfig = [
  string /* name */,
  ?Object /* constants */,
  Array<string> /* functions */,
  Array<number> /* promise method IDs */,
  Array<number> /* sync method IDs */,
];

export type MethodType = 'async' | 'promise' | 'sync';

function genModule(
  config: ?ModuleConfig,
  moduleID: number,
): ?{name: string, module?: Object} {
  if (!config) {
    return null;
  }

  const [moduleName, constants, methods, promiseMethods, syncMethods] = config;
  invariant(
    !moduleName.startsWith('RCT') && !moduleName.startsWith('RK'),
    "Module name prefixes should've been stripped by the native side " +
      "but wasn't for " +
      moduleName,
  );

  if (!constants && !methods) {
    // Module contents will be filled in lazily later
    return {name: moduleName};
  }

  const module = {};
  methods &&
    methods.forEach((methodName, methodID) => {
      const isPromise =
        promiseMethods && arrayContains(promiseMethods, methodID);
      const isSync = syncMethods && arrayContains(syncMethods, methodID);
      invariant(
        !isPromise || !isSync,
        'Cannot have a method that is both async and a sync hook',
      );
      const methodType = isPromise ? 'promise' : isSync ? 'sync' : 'async';
      module[methodName] = genMethod(moduleID, methodID, methodType);
    });
  Object.assign(module, constants);

  if (__DEV__) {
    BatchedBridge.createDebugLookup(moduleID, moduleName, methods);
  }

  return {name: moduleName, module};
}

// export this method as a global so we can call it from native
global.__fbGenNativeModule = genModule;

function loadModule(name: string, moduleID: number): ?Object {
  invariant(
    global.nativeRequireModuleConfig,
    "Can't lazily create module without nativeRequireModuleConfig",
  );
  const config = global.nativeRequireModuleConfig(name);
  const info = genModule(config, moduleID);
  return info && info.module;
}

function genMethod(moduleID: number, methodID: number, type: MethodType) {
  let fn = null;
  if (type === 'promise') {
    fn = function(...args: Array<any>) {
      return new Promise((resolve, reject) => {
        BatchedBridge.enqueueNativeCall(
          moduleID,
          methodID,
          args,
          data => resolve(data),
          errorData => reject(createErrorFromErrorData(errorData)),
        );
      });
    };
  } else if (type === 'sync') {
    fn = function(...args: Array<any>) {
      if (__DEV__) {
        invariant(
          global.nativeCallSyncHook,
          'Calling synchronous methods on native ' +
            'modules is not supported in Chrome.\n\n Consider providing alternative ' +
            'methods to expose this method in debug mode, e.g. by exposing constants ' +
            'ahead-of-time.',
        );
      }
      return global.nativeCallSyncHook(moduleID, methodID, args);
    };
  } else {
    fn = function(...args: Array<any>) {
      const lastArg = args.length > 0 ? args[args.length - 1] : null;
      const secondLastArg = args.length > 1 ? args[args.length - 2] : null;
      const hasSuccessCallback = typeof lastArg === 'function';
      const hasErrorCallback = typeof secondLastArg === 'function';
      hasErrorCallback &&
        invariant(
          hasSuccessCallback,
          'Cannot have a non-function arg after a function arg.',
        );
      const onSuccess = hasSuccessCallback ? lastArg : null;
      const onFail = hasErrorCallback ? secondLastArg : null;
      const callbackCount = hasSuccessCallback + hasErrorCallback;
      args = args.slice(0, args.length - callbackCount);
      BatchedBridge.enqueueNativeCall(
        moduleID,
        methodID,
        args,
        onFail,
        onSuccess,
      );
    };
  }
  fn.type = type;
  return fn;
}

function arrayContains<T>(array: Array<T>, value: T): boolean {
  return array.indexOf(value) !== -1;
}

function createErrorFromErrorData(errorData: {message: string}): ExtendedError {
  const {message, ...extraErrorInfo} = errorData || {};
  const error: ExtendedError = new Error(message);
  error.framesToPop = 1;
  return Object.assign(error, extraErrorInfo);
}

let NativeModules: {[moduleName: string]: Object} = {};
if (global.nativeModuleProxy) {
  NativeModules = global.nativeModuleProxy;
} else if (!global.nativeExtensions) {
  const bridgeConfig = global.__fbBatchedBridgeConfig;
  invariant(
    bridgeConfig,
    '__fbBatchedBridgeConfig is not set, cannot invoke native modules',
  );

  const defineLazyObjectProperty = require('defineLazyObjectProperty');
  (bridgeConfig.remoteModuleConfig || []).forEach(
    (config: ModuleConfig, moduleID: number) => {
      // Initially this config will only contain the module name when running in JSC. The actual
      // configuration of the module will be lazily loaded.
      const info = genModule(config, moduleID);
      if (!info) {
        return;
      }

      if (info.module) {
        NativeModules[info.name] = info.module;
      }
      // If there's no module config, define a lazy getter
      else {
        defineLazyObjectProperty(NativeModules, info.name, {
          get: () => loadModule(info.name, moduleID),
        });
      }
    },
  );
}

module.exports = NativeModules;
