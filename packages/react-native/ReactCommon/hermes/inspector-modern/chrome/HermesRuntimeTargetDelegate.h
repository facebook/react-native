/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>

#include <cxxreact/MessageQueueThread.h>
#include <hermes/hermes.h>
#include <jsinspector-modern/ReactCdp.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * A RuntimeTargetDelegate that enables debugging a Hermes runtime over CDP.
 */
class HermesRuntimeTargetDelegate : public RuntimeTargetDelegate {
 public:
  /**
   * Creates a HermesRuntimeTargetDelegate for the given runtime and message
   * queue thread.
   */
  HermesRuntimeTargetDelegate(
      std::shared_ptr<hermes::HermesRuntime> hermesRuntime,
      std::shared_ptr<MessageQueueThread> jsMessageQueueThread);

  /**
   * Creates a HermesRuntimeTargetDelegate for the given runtime and executor.
   */
  HermesRuntimeTargetDelegate(
      std::shared_ptr<hermes::HermesRuntime> hermesRuntime,
      RuntimeExecutor runtimeExecutor);

  ~HermesRuntimeTargetDelegate() override;

  // RuntimeTargetDelegate methods

  std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate> createAgentDelegate(
      jsinspector_modern::FrontendChannel frontendChannel,
      jsinspector_modern::SessionState& sessionState,
      std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const jsinspector_modern::ExecutionContextDescription&
          executionContextDescription) override;

 private:
  class Impl;

  std::unique_ptr<Impl> impl_;
};

} // namespace facebook::react::jsinspector_modern
