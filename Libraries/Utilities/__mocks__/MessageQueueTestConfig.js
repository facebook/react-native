/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * These don't actually exist anywhere in the code.
 */
'use strict';
var remoteModulesConfig = {
  "RemoteModule1": {
    "moduleID":0,
    "methods":{
      "remoteMethod1":{
        "type":"remote",
        "methodID":0
      },
      "remoteMethod2":{
        "type":"remote",
        "methodID":1
      }
    }
  },
  "RemoteModule2":{
    "moduleID":1,
    "methods":{
      "remoteMethod1":{
        "type":"remote",
        "methodID":0
      },
      "remoteMethod2":{
        "type":"remote",
        "methodID":1
      }
    }
  }
};

/**
 * These actually exist in the __tests__ folder.
 */
var localModulesConfig = {
  "MessageQueueTestModule1": {
    "moduleID":"MessageQueueTestModule1",
    "methods":{
      "testHook1":{
        "type":"local",
        "methodID":"testHook1"
      },
      "testHook2":{
        "type":"local",
        "methodID":"testHook2"
      }
    }
  },
  "MessageQueueTestModule2": {
    "moduleID":"MessageQueueTestModule2",
    "methods": {
      "runLocalCode":{
        "type":"local",
        "methodID":"runLocalCode"
      },
      "runLocalCode2":{
        "type":"local",
        "methodID":"runLocalCode2"
      }
    }
  }
};

var MessageQueueTestConfig = {
  localModuleConfig: localModulesConfig,
  remoteModuleConfig: remoteModulesConfig,
};

module.exports = MessageQueueTestConfig;
