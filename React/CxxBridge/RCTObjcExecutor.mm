/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTObjcExecutor.h"

#import <React/RCTCxxUtils.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTLog.h>
#import <React/RCTProfile.h>
#import <React/RCTUtils.h>
#import <cxxreact/JSBigString.h>
#import <cxxreact/JSExecutor.h>
#import <cxxreact/MessageQueueThread.h>
#import <cxxreact/ModuleRegistry.h>
#import <cxxreact/RAMBundleRegistry.h>
#import <folly/json.h>

namespace facebook {
namespace react {

namespace {

class JSEException : public std::runtime_error {
 public:
  JSEException(NSError *error) : runtime_error([[error description] UTF8String]) {}
};

class RCTObjcExecutor : public JSExecutor {
 public:
  RCTObjcExecutor(
      id<RCTJavaScriptExecutor> jse,
      RCTJavaScriptCompleteBlock errorBlock,
      std::shared_ptr<MessageQueueThread> jsThread,
      std::shared_ptr<ExecutorDelegate> delegate)
      : m_jse(jse), m_errorBlock(errorBlock), m_delegate(std::move(delegate)), m_jsThread(std::move(jsThread))
  {
    m_jsCallback = ^(id json, NSError *error) {
      if (error) {
        // Do not use "m_errorBlock" here as the bridge might be in the middle
        // of invalidation as a result of error handling and "this" can be
        // already deallocated.
        errorBlock(error);
        return;
      }

      m_jsThread->runOnQueue(
          [this, json] { m_delegate->callNativeModules(*this, convertIdToFollyDynamic(json), true); });
    };

    // Synchronously initialize the executor
    [jse setUp];

    folly::dynamic nativeModuleConfig = folly::dynamic::array;
    auto moduleRegistry = m_delegate->getModuleRegistry();
    for (const auto &name : moduleRegistry->moduleNames()) {
      auto config = moduleRegistry->getConfig(name);
      nativeModuleConfig.push_back(config ? config->config : nullptr);
    }

    folly::dynamic config = folly::dynamic::object("remoteModuleConfig", std::move(nativeModuleConfig));

    setGlobalVariable("__fbBatchedBridgeConfig", std::make_unique<JSBigStdString>(folly::toJson(config)));
  }

  void initializeRuntime() override
  {
    // We do nothing here since initialization is done in the constructor
  }

  void loadBundle(std::unique_ptr<const JSBigString> script, std::string sourceURL) override
  {
    RCTProfileBeginFlowEvent();
    [m_jse executeApplicationScript:[NSData dataWithBytes:script->c_str() length:script->size()]
                          sourceURL:[[NSURL alloc] initWithString:@(sourceURL.c_str())]
                         onComplete:^(NSError *error) {
                           RCTProfileEndFlowEvent();

                           if (error) {
                             m_errorBlock(error);
                             return;
                           }

                           [m_jse flushedQueue:m_jsCallback];
                         }];
  }

  void setBundleRegistry(std::unique_ptr<RAMBundleRegistry>) override
  {
    RCTAssert(NO, @"RAM bundles are not supported in RCTObjcExecutor");
  }

  void registerBundle(uint32_t __unused bundleId, const std::string __unused &bundlePath) override
  {
    RCTAssert(NO, @"RAM bundles are not supported in RCTObjcExecutor");
  }

  void callFunction(const std::string &module, const std::string &method, const folly::dynamic &arguments) override
  {
    [m_jse callFunctionOnModule:@(module.c_str())
                         method:@(method.c_str())
                      arguments:convertFollyDynamicToId(arguments)
                       callback:m_jsCallback];
  }

  void invokeCallback(double callbackId, const folly::dynamic &arguments) override
  {
    [m_jse invokeCallbackID:@(callbackId) arguments:convertFollyDynamicToId(arguments) callback:m_jsCallback];
  }

  virtual void setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue) override
  {
    [m_jse injectJSONText:@(jsonValue->c_str()) asGlobalObjectNamed:@(propName.c_str()) callback:m_errorBlock];
  }

  virtual std::string getDescription() override
  {
    return [NSStringFromClass([m_jse class]) UTF8String];
  }

 private:
  id<RCTJavaScriptExecutor> m_jse;
  RCTJavaScriptCompleteBlock m_errorBlock;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  std::shared_ptr<MessageQueueThread> m_jsThread;
  RCTJavaScriptCallback m_jsCallback;
};

}

RCTObjcExecutorFactory::RCTObjcExecutorFactory(id<RCTJavaScriptExecutor> jse, RCTJavaScriptCompleteBlock errorBlock)
    : m_jse(jse), m_errorBlock(errorBlock)
{
}

std::unique_ptr<JSExecutor> RCTObjcExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue)
{
  return std::unique_ptr<JSExecutor>(new RCTObjcExecutor(m_jse, m_errorBlock, jsQueue, delegate));
}

}
}
