/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeTargetDelegate.h"
#include "HermesRuntimeAgentDelegate.h"

#ifdef HERMES_ENABLE_DEBUGGER
#include <hermes/cdp/CDPDebugAPI.h>

using namespace facebook::hermes::cdp;
#endif // HERMES_ENABLE_DEBUGGER

#include <utility>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

class HermesRuntimeTargetDelegate::Impl : public RuntimeTargetDelegate {
 public:
#ifdef HERMES_ENABLE_DEBUGGER
  explicit Impl(std::shared_ptr<HermesRuntime> hermesRuntime)
      : runtime_(std::move(hermesRuntime)),
        cdpDebugAPI_(CDPDebugAPI::create(*runtime_)) {}

  CDPDebugAPI& getCDPDebugAPI() {
    return *cdpDebugAPI_;
  }
#else
  explicit Impl(std::shared_ptr<HermesRuntime> hermesRuntime)
      : runtime_(std::move(hermesRuntime)) {}
#endif

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

#ifdef HERMES_ENABLE_DEBUGGER
  const std::unique_ptr<CDPDebugAPI> cdpDebugAPI_;
#endif
};

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

#ifdef HERMES_ENABLE_DEBUGGER
CDPDebugAPI& HermesRuntimeTargetDelegate::getCDPDebugAPI() {
  return impl_->getCDPDebugAPI();
}
#endif

} // namespace facebook::react::jsinspector_modern
