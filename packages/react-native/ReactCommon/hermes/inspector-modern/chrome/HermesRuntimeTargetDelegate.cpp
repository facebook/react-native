/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/InspectorFlags.h>
#include <jsinspector-modern/RuntimeTarget.h>

#include "HermesRuntimeTargetDelegate.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDPHandler headers or types.
#ifdef HERMES_ENABLE_DEBUGGER
#include "HermesRuntimeAgentDelegate.h"
#include "HermesRuntimeAgentDelegateNew.h"

#include <hermes/cdp/CDPDebugAPI.h>

using namespace facebook::hermes::cdp;
#else
#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#endif // HERMES_ENABLE_DEBUGGER

#include <utility>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

#ifdef HERMES_ENABLE_DEBUGGER
class HermesRuntimeTargetDelegate::Impl final : public RuntimeTargetDelegate {
 public:
  explicit Impl(
      HermesRuntimeTargetDelegate& delegate,
      std::shared_ptr<HermesRuntime> hermesRuntime)
      : delegate_(delegate),
        runtime_(std::move(hermesRuntime)),
        cdpDebugAPI_(CDPDebugAPI::create(*runtime_)) {}

  CDPDebugAPI& getCDPDebugAPI() {
    return *cdpDebugAPI_;
  }

  // RuntimeTargetDelegate methods

  std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      RuntimeExecutor runtimeExecutor) override {
    auto& inspectorFlags = InspectorFlags::getInstance();

    return inspectorFlags.getEnableHermesCDPAgent()
        ? std::unique_ptr<RuntimeAgentDelegate>(
              new HermesRuntimeAgentDelegateNew(
                  frontendChannel,
                  sessionState,
                  std::move(previouslyExportedState),
                  executionContextDescription,
                  *runtime_,
                  delegate_,
                  std::move(runtimeExecutor)))
        : std::unique_ptr<RuntimeAgentDelegate>(new HermesRuntimeAgentDelegate(
              frontendChannel,
              sessionState,
              std::move(previouslyExportedState),
              executionContextDescription,
              runtime_,
              std::move(runtimeExecutor)));
  }

 private:
  HermesRuntimeTargetDelegate& delegate_;
  std::shared_ptr<HermesRuntime> runtime_;
  const std::unique_ptr<CDPDebugAPI> cdpDebugAPI_;
};

#else

/**
 * A stub for HermesRuntimeTargetDelegate when Hermes is compiled without
 * debugging support.
 */
class HermesRuntimeTargetDelegate::Impl final
    : public FallbackRuntimeTargetDelegate {
 public:
  explicit Impl(
      HermesRuntimeTargetDelegate&,
      std::shared_ptr<HermesRuntime> hermesRuntime)
      : FallbackRuntimeTargetDelegate{hermesRuntime->description()} {}
};

#endif // HERMES_ENABLE_DEBUGGER

HermesRuntimeTargetDelegate::HermesRuntimeTargetDelegate(
    std::shared_ptr<HermesRuntime> hermesRuntime)
    : impl_(std::make_unique<Impl>(*this, std::move(hermesRuntime))) {}

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
