/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/JSBigString.h>
#include <cxxreact/JSExecutor.h>
#include <cxxreact/RAMBundleRegistry.h>
#include <jsi/jsi.h>
#include <jsireact/JSINativeModules.h>
#include <functional>
#include <mutex>
#include <optional>

namespace facebook::react {

// A JSIScopedTimeoutInvoker is a trampoline-type function for introducing
// timeouts. Call the TimeoutInvoker with a function to execute, the invokee.
// The TimeoutInvoker will immediately invoke it, synchronously on the same
// thread. If the invokee fails to return after some timeout (private to the
// TimeoutInvoker), a soft error may be reported.
//
// If a soft error is reported, the second parameter errorMessageProducer will
// be invoked to produce an error message, which will be included in the soft
// error report. Note that the errorMessageProducer will be invoked
// asynchronously on a different thread.
//
// The timeout behavior does NOT cause the invokee to aborted. If the invokee
// blocks forever, so will the ScopedTimeoutInvoker (but the soft error may
// still be reported).
//
// The invokee is passed by const ref because it is executed synchronously, but
// the errorMessageProducer is passed by value because it must be copied or
// moved for async execution.
//
// Example usage:
//
//   int param = ...;
//   timeoutInvoker(
//       [&]{ someBigWork(param); },
//       [=] -> std::string {
//           return "someBigWork, param " + std::to_string(param);
//       })
//
using JSIScopedTimeoutInvoker = std::function<void(
    const std::function<void()>& invokee,
    std::function<std::string()> errorMessageProducer)>;

class BigStringBuffer : public jsi::Buffer {
 public:
  BigStringBuffer(std::unique_ptr<const JSBigString> script)
      : script_(std::move(script)) {}

  size_t size() const override {
    return script_->size();
  }

  const uint8_t* data() const override {
    return reinterpret_cast<const uint8_t*>(script_->c_str());
  }

 private:
  std::unique_ptr<const JSBigString> script_;
};

class JSIExecutor : public JSExecutor {
 public:
  using RuntimeInstaller = std::function<void(jsi::Runtime& runtime)>;

  JSIExecutor(
      std::shared_ptr<jsi::Runtime> runtime,
      std::shared_ptr<ExecutorDelegate> delegate,
      const JSIScopedTimeoutInvoker& timeoutInvoker,
      RuntimeInstaller runtimeInstaller);
  void initializeRuntime() override;
  void loadBundle(
      std::unique_ptr<const JSBigString> script,
      std::string sourceURL) override;
  void setBundleRegistry(std::unique_ptr<RAMBundleRegistry>) override;
  void registerBundle(uint32_t bundleId, const std::string& bundlePath)
      override;
  void callFunction(
      const std::string& moduleId,
      const std::string& methodId,
      const folly::dynamic& arguments) override;
  void invokeCallback(const double callbackId, const folly::dynamic& arguments)
      override;
  void setGlobalVariable(
      std::string propName,
      std::unique_ptr<const JSBigString> jsonValue) override;
  std::string getDescription() override;
  void* getJavaScriptContext() override;
  bool isInspectable() override;
  void handleMemoryPressure(int pressureLevel) override;

  // An implementation of JSIScopedTimeoutInvoker that simply runs the
  // invokee, with no timeout.
  static void defaultTimeoutInvoker(
      const std::function<void()>& invokee,
      std::function<std::string()> errorMessageProducer) {
    (void)errorMessageProducer;
    invokee();
  }

  void flush() override;

 private:
  class NativeModuleProxy;

  void bindBridge();
  void callNativeModules(const jsi::Value& queue, bool isEndOfBatch);
  jsi::Value nativeCallSyncHook(const jsi::Value* args, size_t count);
  jsi::Value nativeRequire(const jsi::Value* args, size_t count);
  jsi::Value globalEvalWithSourceUrl(const jsi::Value* args, size_t count);

  std::shared_ptr<jsi::Runtime> runtime_;
  std::shared_ptr<ExecutorDelegate> delegate_;
  std::shared_ptr<JSINativeModules> nativeModules_;
  std::shared_ptr<ModuleRegistry> moduleRegistry_;
  std::once_flag bindFlag_;
  std::unique_ptr<RAMBundleRegistry> bundleRegistry_;
  JSIScopedTimeoutInvoker scopedTimeoutInvoker_;
  RuntimeInstaller runtimeInstaller_;

  std::optional<jsi::Function> callFunctionReturnFlushedQueue_;
  std::optional<jsi::Function> invokeCallbackAndReturnFlushedQueue_;
  std::optional<jsi::Function> flushedQueue_;
};

using Logger =
    std::function<void(const std::string& message, unsigned int logLevel)>;
void bindNativeLogger(jsi::Runtime& runtime, Logger logger);

void bindNativePerformanceNow(jsi::Runtime& runtime);

double performanceNow();
} // namespace facebook::react
