/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTNativeModule.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTLog.h>
#import <React/RCTProfile.h>
#import <React/RCTUtils.h>
#import <reactperflogger/BridgeNativeModulePerfLogger.h>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

namespace {
enum SchedulingContext { Sync, Async };
}

namespace facebook {
namespace react {

static MethodCallResult invokeInner(
    RCTBridge *bridge,
    RCTModuleData *moduleData,
    unsigned int methodId,
    const folly::dynamic &params,
    int callId,
    SchedulingContext context);

RCTNativeModule::RCTNativeModule(RCTBridge *bridge, RCTModuleData *moduleData)
    : m_bridge(bridge), m_moduleData(moduleData)
{
}

std::string RCTNativeModule::getName()
{
  return [m_moduleData.name UTF8String];
}

std::string RCTNativeModule::getSyncMethodName(unsigned int methodId)
{
  return m_moduleData.methods[methodId].JSMethodName;
}

std::vector<MethodDescriptor> RCTNativeModule::getMethods()
{
  std::vector<MethodDescriptor> descs;

  for (id<RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(method.JSMethodName, RCTFunctionDescriptorFromType(method.functionType));
  }

  return descs;
}

folly::dynamic RCTNativeModule::getConstants()
{
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"[RCTNativeModule getConstants] moduleData.exportedConstants", nil);
  NSDictionary *constants = m_moduleData.exportedConstants;
  folly::dynamic ret = convertIdToFollyDynamic(constants);
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  return ret;
}

void RCTNativeModule::invoke(unsigned int methodId, folly::dynamic &&params, int callId)
{
  const char *moduleName = [m_moduleData.name UTF8String];
  const char *methodName = m_moduleData.methods[methodId].JSMethodName;

  dispatch_queue_t queue = m_moduleData.methodQueue;
  const bool isSyncModule = queue == RCTJSThread;

  if (isSyncModule) {
    BridgeNativeModulePerfLogger::syncMethodCallStart(moduleName, methodName);
    BridgeNativeModulePerfLogger::syncMethodCallArgConversionStart(moduleName, methodName);
  } else {
    BridgeNativeModulePerfLogger::asyncMethodCallStart(moduleName, methodName);
  }

  // capture by weak pointer so that we can safely use these variables in a callback
  __weak RCTBridge *weakBridge = m_bridge;
  __weak RCTModuleData *weakModuleData = m_moduleData;
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.
  dispatch_block_t block = [weakBridge, weakModuleData, methodId, params = std::move(params), callId, isSyncModule] {
#ifdef WITH_FBSYSTRACE
    if (callId != -1) {
      fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", callId);
    }
#else
    (void)(callId);
#endif
    @autoreleasepool {
      invokeInner(weakBridge, weakModuleData, methodId, std::move(params), callId, isSyncModule ? Sync : Async);
    }
  };

  if (isSyncModule) {
    block();
    BridgeNativeModulePerfLogger::syncMethodCallReturnConversionEnd(moduleName, methodName);
  } else if (queue) {
    BridgeNativeModulePerfLogger::asyncMethodCallDispatch(moduleName, methodName);
    dispatch_async(queue, block);
  }

#ifdef RCT_DEV
  if (!queue) {
    RCTLog(
        @"Attempted to invoke `%u` (method ID) on `%@` (NativeModule name) without a method queue.",
        methodId,
        m_moduleData.name);
  }
#endif

  if (isSyncModule) {
    BridgeNativeModulePerfLogger::syncMethodCallEnd(moduleName, methodName);
  } else {
    BridgeNativeModulePerfLogger::asyncMethodCallEnd(moduleName, methodName);
  }
}

MethodCallResult RCTNativeModule::callSerializableNativeHook(unsigned int reactMethodId, folly::dynamic &&params)
{
  return invokeInner(m_bridge, m_moduleData, reactMethodId, params, 0, Sync);
}

static MethodCallResult invokeInner(
    RCTBridge *bridge,
    RCTModuleData *moduleData,
    unsigned int methodId,
    const folly::dynamic &params,
    int callId,
    SchedulingContext context)
{
  if (!bridge || !bridge.valid || !moduleData) {
    if (context == Sync) {
      /**
       * NOTE: moduleName and methodName are "". This shouldn't be an issue because there can only be one ongoing sync
       * call at a time, and when we call syncMethodCallFail, that one call should terminate. This is also an
       * exceptional scenario, so it shouldn't occur often.
       */
      BridgeNativeModulePerfLogger::syncMethodCallFail("N/A", "N/A");
    }
    return folly::none;
  }

  id<RCTBridgeMethod> method = moduleData.methods[methodId];
  if (RCT_DEBUG && !method) {
    RCTLogError(@"Unknown methodID: %ud for module: %@", methodId, moduleData.name);
  }

  const char *moduleName = [moduleData.name UTF8String];
  const char *methodName = moduleData.methods[methodId].JSMethodName;

  if (context == Async) {
    BridgeNativeModulePerfLogger::asyncMethodCallExecutionStart(moduleName, methodName, (int32_t)callId);
    BridgeNativeModulePerfLogger::asyncMethodCallExecutionArgConversionStart(moduleName, methodName, (int32_t)callId);
  }

  NSArray *objcParams = convertFollyDynamicToId(params);

  if (context == Sync) {
    BridgeNativeModulePerfLogger::syncMethodCallArgConversionEnd(moduleName, methodName);
  }

  @try {
    if (context == Sync) {
      BridgeNativeModulePerfLogger::syncMethodCallExecutionStart(moduleName, methodName);
    } else {
      BridgeNativeModulePerfLogger::asyncMethodCallExecutionArgConversionEnd(moduleName, methodName, (int32_t)callId);
    }

    id result = [method invokeWithBridge:bridge module:moduleData.instance arguments:objcParams];

    if (context == Sync) {
      BridgeNativeModulePerfLogger::syncMethodCallExecutionEnd(moduleName, methodName);
      BridgeNativeModulePerfLogger::syncMethodCallReturnConversionStart(moduleName, methodName);
    } else {
      BridgeNativeModulePerfLogger::asyncMethodCallExecutionEnd(moduleName, methodName, (int32_t)callId);
    }

    return convertIdToFollyDynamic(result);
  } @catch (NSException *exception) {
    if (context == Sync) {
      BridgeNativeModulePerfLogger::syncMethodCallFail(moduleName, methodName);
    } else {
      BridgeNativeModulePerfLogger::asyncMethodCallExecutionFail(moduleName, methodName, (int32_t)callId);
    }

    // Pass on JS exceptions
    if ([exception.name hasPrefix:RCTFatalExceptionName]) {
      @throw exception;
    }

#if RCT_DEBUG
    NSString *message = [NSString
        stringWithFormat:@"Exception '%@' was thrown while invoking %s on target %@ with params %@\ncallstack: %@",
                         exception,
                         method.JSMethodName,
                         moduleData.name,
                         objcParams,
                         exception.callStackSymbols];
    RCTFatal(RCTErrorWithMessage(message));
#else
    RCTFatalException(exception);
#endif
  }

  return folly::none;
}

}
}
