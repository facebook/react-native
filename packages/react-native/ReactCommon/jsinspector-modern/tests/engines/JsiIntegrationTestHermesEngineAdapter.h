/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/RuntimeTarget.h>

#include <folly/executors/QueuedImmediateExecutor.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * An engine adapter for JsiIntegrationTest that uses Hermes (and Hermes's
 * CDP support).
 */
class JsiIntegrationTestHermesEngineAdapter : public RuntimeTargetDelegate {
 public:
  explicit JsiIntegrationTestHermesEngineAdapter(folly::Executor& jsExecutor);

  virtual std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription) override;

  jsi::Runtime& getRuntime() const noexcept;

  RuntimeExecutor getRuntimeExecutor() const noexcept;

 private:
  std::shared_ptr<facebook::hermes::HermesRuntime> runtime_;
  folly::Executor& jsExecutor_;
};

} // namespace facebook::react::jsinspector_modern
