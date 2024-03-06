/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeTargetDelegate.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDPHandler headers or types.
#ifdef HERMES_ENABLE_DEBUGGER
#include "HermesRuntimeAgentDelegate.h"
#else
#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#endif // HERMES_ENABLE_DEBUGGER

#include <utility>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

#ifdef HERMES_ENABLE_DEBUGGER
class HermesRuntimeTargetDelegate::Impl final : public RuntimeTargetDelegate {
 public:
  explicit Impl(std::shared_ptr<HermesRuntime> hermesRuntime)
      : runtime_(std::move(hermesRuntime)) {}

  // RuntimeTargetDelegate methods

  std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      RuntimeExecutor runtimeExecutor) override {
    return std::unique_ptr<RuntimeAgentDelegate>(new HermesRuntimeAgentDelegate(
        frontendChannel,
        sessionState,
        std::move(previouslyExportedState),
        executionContextDescription,
        runtime_,
        std::move(runtimeExecutor)));
  }

 private:
  std::shared_ptr<HermesRuntime> runtime_;
};

#else

/**
 * A stub for HermesRuntimeTargetDelegate when Hermes is compiled without
 * debugging support.
 */
class HermesRuntimeTargetDelegate::Impl final
    : public FallbackRuntimeTargetDelegate {
 public:
  explicit Impl(std::shared_ptr<HermesRuntime> hermesRuntime)
      : FallbackRuntimeTargetDelegate{hermesRuntime->description()} {}
};

#endif // HERMES_ENABLE_DEBUGGER

HermesRuntimeTargetDelegate::HermesRuntimeTargetDelegate(
    std::shared_ptr<HermesRuntime> hermesRuntime)
    : impl_(std::make_unique<Impl>(std::move(hermesRuntime))) {}

HermesRuntimeTargetDelegate::~HermesRuntimeTargetDelegate() = default;

std::unique_ptr<RuntimeAgentDelegate>
HermesRuntimeTargetDelegate::createAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription,
    RuntimeExecutor runtimeExecutor) {
  return impl_->createAgentDelegate(
      frontendChannel,
      sessionState,
      std::move(previouslyExportedState),
      executionContextDescription,
      std::move(runtimeExecutor));
}

} // namespace facebook::react::jsinspector_modern
