/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/MessageQueueThread.h>
#include <jsi/jsi.h>
#include <jsinspector-modern/ReactCdp.h>

namespace facebook::react {

/**
 * An interface that represents an instance of a JS VM
 */
class JSRuntime : public jsinspector_modern::RuntimeTargetDelegate {
 public:
  virtual jsi::Runtime& getRuntime() noexcept = 0;

  virtual ~JSRuntime() = default;
};

/**
 * Interface for a class that creates instances of a JS VM
 */
class JSRuntimeFactory {
 public:
  virtual std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept = 0;

  virtual ~JSRuntimeFactory() = default;
};

/**
 * Utility class for creating a JSRuntime from a uniquely owned jsi::Runtime.
 */
class JSIRuntimeHolder : public JSRuntime {
 public:
  jsi::Runtime& getRuntime() noexcept override;
  std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate> createAgentDelegate(
      jsinspector_modern::FrontendChannel frontendChannel,
      jsinspector_modern::SessionState& sessionState,
      std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const jsinspector_modern::ExecutionContextDescription&
          executionContextDescription) override;

  explicit JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime);

 private:
  std::unique_ptr<jsi::Runtime> runtime_;
};

} // namespace facebook::react
