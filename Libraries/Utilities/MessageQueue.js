/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MessageQueue
 */

// React-Native bridge 相关核心逻辑在这个文件中
// @NOTE: 注意，本文件中所有的 methodName 都表示 Native 侧所导出的 `JSMethodName`，
//        iOS 见 `- [RCTModuleData generateConfig]` 方法

/*eslint no-bitwise: 0*/

'use strict';

// require 类似于 import 的作用，将 require('xxx') 文件中 module.exports 导出的对象赋值给某一变量
let BridgeProfiling = require('BridgeProfiling');
let ErrorUtils = require('ErrorUtils');
let JSTimersExecution = require('JSTimersExecution');
let ReactUpdates = require('ReactUpdates');

let invariant = require('invariant');
let keyMirror = require('keyMirror');
let stringifySafe = require('stringifySafe');

/*
  对应端上 `RCTBatchedBridge.m` 文件中的枚举，具体如下：
  typedef NS_ENUM(NSUInteger, RCTBridgeFields) {
    RCTBridgeFieldRequestModuleIDs = 0,
    RCTBridgeFieldMethodIDs,
    RCTBridgeFieldParamss,
  };
*/
let MODULE_IDS = 0;
let METHOD_IDS = 1;
let PARAMS = 2;

let SPY_MODE = false;

// 方法类型
let MethodTypes = keyMirror({
    // JS 侧函数
    local: null,
    // Native 侧导出函数
    remote: null,
    // Native 侧导出函数，包含 `RCTPromiseResolveBlock`、`RCTPromiseRejectBlock`
    // 类型的参数，对应的 JS 侧使用了 Promise 进行函数调用
    remoteAsync: null,
});

var guard = (fn) => {
    try {
        fn();
    } catch (error) {
        ErrorUtils.reportFatalError(error);
    }
};

class MessageQueue {
    // `MessageQueue` 的构造函数
    constructor(remoteModules, localModules, customRequire) {
        this.RemoteModules = {};

        this._require = customRequire || require;

        // `_queue` 是一个二维数组，里面分别存储着 `module / method / params` 三种数据集合
        this._queue = [
            [],
            [],
            []
        ];
        // {
        //    'moduleID': 'moduleName',
        //    ...,
        // }
        this._moduleTable = {};
        // {
        //    'moduleID': {
        //        'methodID': 'JSMethodName', 
        //        ...,
        //    },
        //    ...,
        // }
        this._methodTable = {};
        this._callbacks = [];
        this._callbackID = 0;

        [
            'processBatch',
            'invokeCallbackAndReturnFlushedQueue',
            'callFunctionReturnFlushedQueue',
            'flushedQueue',
        ].forEach((fn) => this[fn] = this[fn].bind(this));

        this._genModules(remoteModules);
        localModules && this._genLookupTables(
            localModules, this._moduleTable, this._methodTable);

        if (__DEV__) {
            this._debugInfo = {};
            this._remoteModuleTable = {};
            this._remoteMethodTable = {};
            this._genLookupTables(
                remoteModules, this._remoteModuleTable, this._remoteMethodTable);
        }
    }

    /**
     * Public APIs
     */
    processBatch(batch) {
        guard(() => {
            ReactUpdates.batchedUpdates(() => {
                batch.forEach((call) => {
                    let method = call.method === 'callFunctionReturnFlushedQueue' ?
                        '__callFunction' : '__invokeCallback';
                    guard(() => this[method].apply(this, call.args));
                });
                BridgeProfiling.profile('ReactUpdates.batchedUpdates()');
            });
            BridgeProfiling.profileEnd();
        });
        return this.flushedQueue();
    }

    callFunctionReturnFlushedQueue(module, method, args) {
        guard(() => this.__callFunction(module, method, args));
        return this.flushedQueue();
    }

    invokeCallbackAndReturnFlushedQueue(cbID, args) {
        guard(() => this.__invokeCallback(cbID, args));
        return this.flushedQueue();
    }

    flushedQueue() {
        BridgeProfiling.profile('JSTimersExecution.callImmediates()');
        guard(() => JSTimersExecution.callImmediates());
        BridgeProfiling.profileEnd();
        let queue = this._queue;
        this._queue = [
            [],
            [],
            []
        ];
        return queue[0].length ? queue : null;
    }

    /**
     * "Private" methods
     */

    // @brief 调用 Native 侧的函数（还是以 JS 的方式调用函数，是通过 JSCore 的方式调用到 Native 侧已经注册好的函数的）
    // @param module moduleID
    // @param method methodID
    // @param args 参数列表
    __callFunction(module, method, args) {
        BridgeProfiling.profile(() => `${module}.${method}(${stringifySafe(args)})`);
        if (isFinite(module)) {
            // 获取 JSMethodName
            method = this._methodTable[module][method];
            // 获取 moduleName
            module = this._moduleTable[module];
        }
        if (__DEV__ && SPY_MODE) {
            console.log('N->JS : ' + module + '.' + method + '(' + JSON.stringify(args) + ')');
        }

        // WARNING: JS 侧是否一定存在导入的 module 模块呢？？？？？
        // 作用和 `let invariant = require('invariant');` 相同，导入 module
        module = this._require(module);
        // 调用 JS 函数（iOS 会通过 JSCore 执行 Native 侧已经注入到 JSContext 中的方法）
        module[method].apply(module, args);
        BridgeProfiling.profileEnd();
    }

    // @brief 调用回调
    // @param cbID callbackID
    // @param args 回调的参数列表
    __invokeCallback(cbID, args) {
        BridgeProfiling.profile(
            () => `MessageQueue.invokeCallback(${cbID}, ${stringifySafe(args)})`);
        // 通过 callbackID 找到对应的 callback 实例（function 类型）
        let callback = this._callbacks[cbID];
        if (__DEV__) {
            let debug = this._debugInfo[cbID >> 1];
            let module = debug && this._remoteModuleTable[debug[0]];
            let method = debug && this._remoteMethodTable[debug[0]][debug[1]];
            if (!callback) {
                console.error(`Callback with id ${cbID}: ${module}.${method}() not found`);
            } else if (SPY_MODE) {
                console.log('N->JS : <callback for ' + module + '.' + method + '>(' + JSON.stringify(args) + ')');
            }
        }
        this._callbacks[cbID & ~1] = null;
        this._callbacks[cbID | 1] = null;
        // 调用 callback，JS 侧接收回调参数（猜测第一个参数 null 是因为不想改变 callback 函数的上下文，即函数中的 this 关键字）
        callback.apply(null, args);
        BridgeProfiling.profileEnd();
    }

    /**
     * Private helper methods
     */

    // @brief 获取并设置 `this._moduleTable` 及 `this._methodTable` 的存储数据
    // @param localModules 外部传入的 localModules，来自于 `BatchedBridge.js` 文件
    //                     中的 `__fbBatchedBridgeConfig.localModulesConfig` 变量
    // @param moduleTable  this._moduleTable，map 类型，{'moduleID': 'moduleName'}
    // @param methodTable  this._methodTable，map 类型，{'moduleID': {'methodID': 'JSMethodName', ...}}
    _genLookupTables(localModules, moduleTable, methodTable) {
        // 获取 localModules 中所有的 key 并存放到数组 `moduleNames` 中
        let moduleNames = Object.keys(localModules);
        for (var i = 0, l = moduleNames.length; i < l; i++) {
            let moduleName = moduleNames[i];
            let methods = localModules[moduleName].methods;
            let moduleID = localModules[moduleName].moduleID;
            moduleTable[moduleID] = moduleName;
            methodTable[moduleID] = {};

            let methodNames = Object.keys(methods);
            for (var j = 0, k = methodNames.length; j < k; j++) {
                let methodName = methodNames[j];
                let methodConfig = methods[methodName];
                methodTable[moduleID][methodConfig.methodID] = methodName; // JSMethodName
            }
        }
    }

    // @brief 向 `RemoteModules` 中添加 modules 包装数据
    // @param remoteModules `remoteModules` 是 Native 侧导出的 map，详见 `RCTBatchedBridge.m` 
    //                      文件中 `- initJS` 方法，包装后得到的目标数据格式（this.RemoteModules）如下：
    //  {
    //      'moduleName': {
    //          'methodName': {
    //              'JSMethodName': __nativeCall 函数实例,
    //              ...,
    //          }
    //      },
    //      ...,
    //  }
    _genModules(remoteModules) {
        let moduleNames = Object.keys(remoteModules);
        for (var i = 0, l = moduleNames.length; i < l; i++) {
            let moduleName = moduleNames[i];
            // `moduleConfig` 中包含 `moduleID / methods / constants` 等信息
            let moduleConfig = remoteModules[moduleName];
            this.RemoteModules[moduleName] = this._genModule({}, moduleConfig);
        }
    }

    // @brief 获取单个 module 下包装数据
    // @param module 外部传递一个空的 map 即可
    // @param moduleConfig module 导出的 config 数据，包括 `moduleID / methods / constants`
    // @return 每个 module 下包装完成的数据，map 类型，KV 格式如下：
    //  {
    //    'JSMethodName': __nativeCall 函数实例
    //    ...
    //  }
    _genModule(module, moduleConfig) {
        let methodNames = Object.keys(moduleConfig.methods);
        for (var i = 0, l = methodNames.length; i < l; i++) {
            let methodName = methodNames[i];
            let methodConfig = moduleConfig.methods[methodName];
            module[methodName] = this._genMethod(
                moduleConfig.moduleID, methodConfig.methodID, methodConfig.type);
        }
        Object.assign(module, moduleConfig.constants);
        return module;
    }

    // @brief 获取单个 method 包装数据
    // @param module moduleID
    // @param method methodID
    // @param type 函数类型
    // @return 由 `__nativeCall` 构造的 function 类型
    _genMethod(module, method, type) {
        if (type === MethodTypes.local) {
            return null;
        }

        let self = this;
        if (type === MethodTypes.remoteAsync) {
            return function(...args) {
                return new Promise((resolve, reject) => {
                    self.__nativeCall(module, method, args, resolve, (errorData) => {
                        var error = createErrorFromErrorData(errorData);
                        reject(error);
                    });
                });
            };
        } else {
            return function(...args) {
                let lastArg = args.length > 0 ? args[args.length - 1] : null;
                let secondLastArg = args.length > 1 ? args[args.length - 2] : null;
                let hasSuccCB = typeof lastArg === 'function';
                let hasErrorCB = typeof secondLastArg === 'function';

                // 这里约定普通类型参数位置只能在回调参数（即 Native 侧的 block 回调参数）之前，否则会报错
                hasErrorCB && invariant(
                    hasSuccCB,
                    'Cannot have a non-function arg after a function arg.'
                );
                let numCBs = hasSuccCB + hasErrorCB;
                let onSucc = hasSuccCB ? lastArg : null;
                let onFail = hasErrorCB ? secondLastArg : null;
                args = args.slice(0, args.length - numCBs);
                return self.__nativeCall(module, method, args, onFail, onSucc);
            };
        }
    }

    // @brief 包装最终使用的 method 
    // @param module moduleID
    // @param method methodID
    // @param params 参数列表（不包括 onFail 和 onSucc 两个回调）
    // @param onFail 失败回调
    // @param onSucc 成功回调
    __nativeCall(module, method, params, onFail, onSucc) {
        if (onFail || onSucc) {
            if (__DEV__) {
                // eventually delete old debug info
                (this._callbackID > (1 << 5)) &&
                (this._debugInfo[this._callbackID >> 5] = null);

                this._debugInfo[this._callbackID >> 1] = [module, method];
            }
            onFail && params.push(this._callbackID);
            this._callbacks[this._callbackID++] = onFail;
            onSucc && params.push(this._callbackID);
            this._callbacks[this._callbackID++] = onSucc;
        }
        // 向保存着 moduleID 的数组中添加 moduleID
        this._queue[MODULE_IDS].push(module);
        // 向保存着 methodID 的数组中添加 methodID
        this._queue[METHOD_IDS].push(method);
        // 向保存着参数列表的数组中添加参数列表
        // [[每个 method 下的全部参数], ...]
        this._queue[PARAMS].push(params);
        if (__DEV__ && SPY_MODE && isFinite(module)) {
            console.log('JS->N : ' + this._remoteModuleTable[module] + '.' +
                this._remoteMethodTable[module][method] + '(' + JSON.stringify(params) + ')');
        }
    }


}

function createErrorFromErrorData(errorData: ErrorData): Error {
    var {
        message,
        ...extraErrorInfo,
    } = errorData;
    var error = new Error(message);
    error.framesToPop = 1;
    return Object.assign(error, extraErrorInfo);
}

module.exports = MessageQueue;