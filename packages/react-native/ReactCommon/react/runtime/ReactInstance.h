/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/MessageQueueThread.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsi/jsi.h>
#include <jsinspector-modern/ReactCdp.h>
#include <jsireact/JSIExecutor.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/runtime/BufferedRuntimeExecutor.h>
#include <react/runtime/JSRuntimeFactory.h>
#include <react/runtime/TimerManager.h>

namespace facebook::react {

struct CallableModule {
  explicit CallableModule(jsi::Function factory)
      : factory(std::move(factory)) {}
  jsi::Function factory;
};

class ReactInstance final : private jsinspector_modern::InstanceTargetDelegate {
 public:
  using BindingsInstallFunc = std::function<void(jsi::Runtime& runtime)>;

  ReactInstance(
      std::unique_ptr<JSRuntime> runtime,
      std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
      std::shared_ptr<TimerManager> timerManager,
      JsErrorHandler::JsErrorHandlingFunc JsErrorHandlingFunc,
      jsinspector_modern::PageTarget* parentInspectorTarget = nullptr);

  RuntimeExecutor getUnbufferedRuntimeExecutor() noexcept;

  RuntimeExecutor getBufferedRuntimeExecutor() noexcept;

  std::shared_ptr<RuntimeScheduler> getRuntimeScheduler() noexcept;

  struct JSRuntimeFlags {
    bool isProfiling = false;
    const std::string runtimeDiagnosticFlags = "";
  };

  void initializeRuntime(
      JSRuntimeFlags options,
      BindingsInstallFunc bindingsInstallFunc) noexcept;

  void loadScript(
      std::unique_ptr<const JSBigString> script,
      const std::string& sourceURL);

  void registerSegment(uint32_t segmentId, const std::string& segmentPath);

  void callFunctionOnModule(
      const std::string& moduleName,
      const std::string& methodName,
      const folly::dynamic& args);

  void handleMemoryPressureJs(int pressureLevel);

  /**
   * Unregisters the instance from the inspector. This method must be called
   * on the main (non-JS) thread.
   */
  void unregisterFromInspector();

  void* getJavaScriptContext();

 private:
  std::shared_ptr<JSRuntime> runtime_;
  std::shared_ptr<MessageQueueThread> jsMessageQueueThread_;
  std::shared_ptr<BufferedRuntimeExecutor> bufferedRuntimeExecutor_;
  std::shared_ptr<TimerManager> timerManager_;
  std::unordered_map<std::string, std::shared_ptr<CallableModule>> modules_;
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
  JsErrorHandler jsErrorHandler_;

  // Whether there are errors caught during bundle loading
  std::shared_ptr<bool> hasFatalJsError_;

  jsinspector_modern::InstanceTarget* inspectorTarget_{nullptr};
  jsinspector_modern::RuntimeTarget* runtimeInspectorTarget_{nullptr};
  jsinspector_modern::PageTarget* parentInspectorTarget_{nullptr};
};

} // namespace facebook::react
