// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <string>

#include <cxxreact/JSBigString.h>
#include <folly/Optional.h>
#include <folly/dynamic.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

#define UNPACKED_JS_SOURCE_PATH_SUFFIX "/bundle.js"
#define UNPACKED_META_PATH_SUFFIX "/bundle.meta"
#define UNPACKED_BYTECODE_SUFFIX "/bundle.bytecode"

enum {
  UNPACKED_JS_SOURCE = (1 << 0),
  UNPACKED_BYTECODE = (1 << 1),
};

class JSExecutor;
class JSModulesUnbundle;
class MessageQueueThread;
class ModuleRegistry;

using MethodCallResult = folly::Optional<folly::dynamic>;

// This interface describes the delegate interface required by
// Executor implementations to call from JS into native code.
class ExecutorDelegate {
 public:
  virtual ~ExecutorDelegate() {}

  virtual std::shared_ptr<ModuleRegistry> getModuleRegistry() = 0;

  virtual void callNativeModules(
    JSExecutor& executor, folly::dynamic&& calls, bool isEndOfBatch) = 0;
  virtual MethodCallResult callSerializableNativeHook(
    JSExecutor& executor, unsigned int moduleId, unsigned int methodId, folly::dynamic&& args) = 0;
};

class JSExecutorFactory {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) = 0;
  virtual ~JSExecutorFactory() {}
};

class JSExecutor {
public:
  /**
   * Execute an application script bundle in the JS context.
   */
  virtual void loadApplicationScript(std::unique_ptr<const JSBigString> script,
                                     std::string sourceURL) = 0;

  /**
   * Add an application "unbundle" file
   */
  virtual void setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle> bundle) = 0;

  /**
   * Executes BatchedBridge.callFunctionReturnFlushedQueue with the module ID,
   * method ID and optional additional arguments in JS. The executor is responsible
   * for using Bridge->callNativeModules to invoke any necessary native modules methods.
   */
  virtual void callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) = 0;

  /**
   * Executes BatchedBridge.invokeCallbackAndReturnFlushedQueue with the cbID,
   * and optional additional arguments in JS and returns the next queue. The executor
   * is responsible for using Bridge->callNativeModules to invoke any necessary
   * native modules methods.
   */
  virtual void invokeCallback(const double callbackId, const folly::dynamic& arguments) = 0;

  virtual void setGlobalVariable(std::string propName,
                                 std::unique_ptr<const JSBigString> jsonValue) = 0;
  virtual void* getJavaScriptContext() {
    return nullptr;
  }
  virtual bool supportsProfiling() {
    return false;
  }
  virtual void startProfiler(const std::string &titleString) {}
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) {}
  virtual void handleMemoryPressureUiHidden() {}
  virtual void handleMemoryPressureModerate() {}
  virtual void handleMemoryPressureCritical() {
    handleMemoryPressureModerate();
  }
  virtual void destroy() {}
  virtual ~JSExecutor() {}
};

} }
