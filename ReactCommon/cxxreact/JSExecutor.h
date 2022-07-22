/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <cxxreact/NativeModule.h>
#include <folly/dynamic.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class JSBigString;
class JSExecutor;
class JSModulesUnbundle;
class MessageQueueThread;
class ModuleRegistry;
class RAMBundleRegistry;

// This interface describes the delegate interface required by
// Executor implementations to call from JS into native code.
class ExecutorDelegate {
 public:
  virtual ~ExecutorDelegate() {}

  virtual std::shared_ptr<ModuleRegistry> getModuleRegistry() = 0;

  virtual void callNativeModules(
      JSExecutor &executor,
      folly::dynamic &&calls,
      bool isEndOfBatch) = 0;
  virtual MethodCallResult callSerializableNativeHook(
      JSExecutor &executor,
      unsigned int moduleId,
      unsigned int methodId,
      folly::dynamic &&args) = 0;
};

using NativeExtensionsProvider =
    std::function<folly::dynamic(const std::string &)>;

class JSExecutorFactory {
 public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) = 0;
  virtual ~JSExecutorFactory() {}
};

class RN_EXPORT JSExecutor {
 public:
  /**
   * Prepares the JS runtime for React Native by installing global variables.
   * Called once before any JS is evaluated.
   */
  virtual void initializeRuntime() = 0;
  /**
   * Execute an application script bundle in the JS context.
   */
  virtual void loadBundle(
      std::unique_ptr<const JSBigString> script,
      std::string sourceURL) = 0;

  /**
   * Add an application "RAM" bundle registry
   */
  virtual void setBundleRegistry(
      std::unique_ptr<RAMBundleRegistry> bundleRegistry) = 0;

  /**
   * Register a file path for an additional "RAM" bundle
   */
  virtual void registerBundle(
      uint32_t bundleId,
      const std::string &bundlePath) = 0;

  /**
   * Executes BatchedBridge.callFunctionReturnFlushedQueue with the module ID,
   * method ID and optional additional arguments in JS. The executor is
   * responsible for using Bridge->callNativeModules to invoke any necessary
   * native modules methods.
   */
  virtual void callFunction(
      const std::string &moduleId,
      const std::string &methodId,
      const folly::dynamic &arguments) = 0;

  /**
   * Executes BatchedBridge.invokeCallbackAndReturnFlushedQueue with the cbID,
   * and optional additional arguments in JS and returns the next queue. The
   * executor is responsible for using Bridge->callNativeModules to invoke any
   * necessary native modules methods.
   */
  virtual void invokeCallback(
      const double callbackId,
      const folly::dynamic &arguments) = 0;

  virtual void setGlobalVariable(
      std::string propName,
      std::unique_ptr<const JSBigString> jsonValue) = 0;

  virtual void *getJavaScriptContext() {
    return nullptr;
  }

  /**
   * Returns whether or not the underlying executor supports debugging via the
   * Chrome remote debugging protocol.
   */
  virtual bool isInspectable() {
    return false;
  }

  /**
   * The description is displayed in the dev menu, if there is one in
   * this build.  There is a default, but if this method returns a
   * non-empty string, it will be used instead.
   */
  virtual std::string getDescription() = 0;

  virtual void handleMemoryPressure(__attribute__((unused)) int pressureLevel) {
  }

  virtual void destroy() {}
  virtual ~JSExecutor() {}

  virtual void flush() {}

  static std::string getSyntheticBundlePath(
      uint32_t bundleId,
      const std::string &bundlePath);
};

} // namespace react
} // namespace facebook
