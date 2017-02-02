/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTObjcExecutor.h"

#import <React/RCTCxxUtils.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTLog.h>
#import <React/RCTProfile.h>
#import <React/RCTUtils.h>
#import <cxxreact/Executor.h>
#import <cxxreact/ModuleRegistry.h>
#import <folly/json.h>

namespace facebook {
namespace react {

namespace {

class JSEException : public std::runtime_error {
public:
  JSEException(NSError *error)
    : runtime_error([[error description] UTF8String]) {}
};

class RCTObjcExecutor : public JSExecutor {
public:
  RCTObjcExecutor(id<RCTJavaScriptExecutor> jse, RCTJavaScriptCompleteBlock errorBlock,
                  std::shared_ptr<facebook::react::ExecutorDelegate> delegate)
    : m_jse(jse)
    , m_errorBlock(errorBlock)
    , m_delegate(delegate)
  {
    m_jsCallback = ^(id json, NSError *error) {
      if (error) {
        m_errorBlock(error);
        return;
      }

      m_delegate->callNativeModules(*this, [RCTConvert folly_dynamic:json], true);
    };

    // Synchronously initialize the executor
    [jse setUp];

    folly::dynamic nativeModuleConfig = folly::dynamic::array;
    auto moduleRegistry = delegate->getModuleRegistry();
    for (const auto &name : moduleRegistry->moduleNames()) {
      auto config = moduleRegistry->getConfig(name);
      nativeModuleConfig.push_back(config ? config->config : nullptr);
    }

    folly::dynamic config =
      folly::dynamic::object("remoteModuleConfig", std::move(nativeModuleConfig));

    setGlobalVariable(
      "__fbBatchedBridgeConfig",
      std::make_unique<JSBigStdString>(folly::toJson(config)));
  }

  void loadApplicationScript(
      std::unique_ptr<const JSBigString> script,
      std::string sourceURL) override {
    RCTProfileBeginFlowEvent();
    [m_jse executeApplicationScript:[NSData dataWithBytes:script->c_str() length:script->size()]
           sourceURL:[[NSURL alloc]
                         initWithString:@(sourceURL.c_str())]
           onComplete:^(NSError *error) {
        RCTProfileEndFlowEvent();

        if (error) {
          m_errorBlock(error);
          return;
        }

        [m_jse flushedQueue:m_jsCallback];
      }];
  }

  void setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle>) override {
    RCTLogWarn(@"Unbundle is not supported in RCTObjcExecutor");
  }

  void callFunction(const std::string &module, const std::string &method,
                    const folly::dynamic &arguments) override {
    [m_jse callFunctionOnModule:@(module.c_str())
           method:@(method.c_str())
           arguments:RCTConvertFollyDynamic(arguments)
           callback:m_jsCallback];
  }

  void invokeCallback(double callbackId, const folly::dynamic &arguments) override {
    [m_jse invokeCallbackID:@(callbackId)
           arguments:RCTConvertFollyDynamic(arguments)
           callback:m_jsCallback];
  }

  virtual void setGlobalVariable(
      std::string propName,
      std::unique_ptr<const JSBigString> jsonValue) override {
    [m_jse injectJSONText:@(jsonValue->c_str())
           asGlobalObjectNamed:@(propName.c_str())
           callback:m_errorBlock];
  }

  virtual bool supportsProfiling() override {
    return false;
  };
  virtual void startProfiler(const std::string &titleString) override {};
  virtual void stopProfiler(const std::string &titleString,
                            const std::string &filename) override {};

private:
  id<RCTJavaScriptExecutor> m_jse;
  RCTJavaScriptCompleteBlock m_errorBlock;
  std::shared_ptr<facebook::react::ExecutorDelegate> m_delegate;
  RCTJavaScriptCallback m_jsCallback;
};

}

RCTObjcExecutorFactory::RCTObjcExecutorFactory(
  id<RCTJavaScriptExecutor> jse, RCTJavaScriptCompleteBlock errorBlock)
  : m_jse(jse)
  , m_errorBlock(errorBlock) {}

std::unique_ptr<JSExecutor> RCTObjcExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) {
  return std::unique_ptr<JSExecutor>(
    new RCTObjcExecutor(m_jse, m_errorBlock, delegate));
}

}
}
