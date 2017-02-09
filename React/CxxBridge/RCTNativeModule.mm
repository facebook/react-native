/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNativeModule.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTProfile.h>
#import <React/RCTUtils.h>

namespace facebook {
namespace react {

RCTNativeModule::RCTNativeModule(RCTBridge *bridge, RCTModuleData *moduleData)
    : m_bridge(bridge)
    , m_moduleData(moduleData) {}

std::string RCTNativeModule::getName() {
  return [m_moduleData.name UTF8String];
}

std::vector<MethodDescriptor> RCTNativeModule::getMethods() {
  std::vector<MethodDescriptor> descs;

  for (id<RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(
      method.JSMethodName.UTF8String,
      method.functionType == RCTFunctionTypePromise ? "promise" : "async"
    );
  }

  return descs;
}

folly::dynamic RCTNativeModule::getConstants() {
  // TODO mhorowitz #10487027: This does unnecessary work since it
  // only needs constants.  Think about refactoring RCTModuleData or
  // NativeModule to make this more natural.

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"[RCTNativeModule getConstants] moduleData.config", nil);
  NSArray *config = m_moduleData.config;
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  if (!config || config == (id)kCFNull) {
    return nullptr;
  }
  id constants = config[1];
  if (![constants isKindOfClass:[NSDictionary class]]) {
      return nullptr;
  }
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"[RCTNativeModule getConstants] convert", nil);
  folly::dynamic ret = [RCTConvert folly_dynamic:constants];
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  return ret;
}

bool RCTNativeModule::supportsWebWorkers() {
  return false;
}

void RCTNativeModule::invoke(ExecutorToken token, unsigned int methodId, folly::dynamic &&params) {
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.

  // There is no flow event handling here until I can understand it.

  auto sparams = std::make_shared<folly::dynamic>(std::move(params));

  __weak RCTBridge *bridge = m_bridge;

  dispatch_block_t block = ^{
    if (!bridge || !bridge.valid) {
      return;
    }

    id<RCTBridgeMethod> method = m_moduleData.methods[methodId];
    if (RCT_DEBUG && !method) {
      RCTLogError(@"Unknown methodID: %ud for module: %@",
                  methodId, m_moduleData.name);
    }

    NSArray *objcParams = RCTConvertFollyDynamic(*sparams);

    @try {
      [method invokeWithBridge:bridge module:m_moduleData.instance arguments:objcParams];
    }
    @catch (NSException *exception) {
      // Pass on JS exceptions
      if ([exception.name hasPrefix:RCTFatalExceptionName]) {
        @throw exception;
      }

      NSString *message = [NSString stringWithFormat:
                           @"Exception '%@' was thrown while invoking %@ on target %@ with params %@",
                           exception, method.JSMethodName, m_moduleData.name, objcParams];
      RCTFatal(RCTErrorWithMessage(message));
    }
  };

  dispatch_queue_t queue = m_moduleData.methodQueue;

  if (queue == RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

MethodCallResult RCTNativeModule::callSerializableNativeHook(
    ExecutorToken token, unsigned int reactMethodId, folly::dynamic &&params) {
  RCTFatal(RCTErrorWithMessage(@"callSerializableNativeHook is not yet supported on iOS"));
  return folly::none;
}


}
}
