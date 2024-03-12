/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef HERMES_ENABLE_DEBUGGER

#include "HermesRuntimeAgentDelegateNew.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDP headers or types.

#include <hermes/AsyncDebuggerAPI.h>
#include <hermes/cdp/CDPAgent.h>
#include <hermes/inspector/RuntimeAdapter.h>

#include <hermes/hermes.h>
#include <jsinspector-modern/ReactCdp.h>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

class HermesRuntimeAgentDelegateNew::Impl final : public RuntimeAgentDelegate {
  using HermesState = hermes::cdp::State;

  struct HermesStateWrapper : public ExportedState {
    explicit HermesStateWrapper(HermesState state) : state_(std::move(state)) {}

    static HermesState unwrapDestructively(ExportedState* wrapper) {
      if (!wrapper) {
        return {};
      }
      if (auto* typedWrapper = dynamic_cast<HermesStateWrapper*>(wrapper)) {
        return std::move(typedWrapper->state_);
      }
      return {};
    }

   private:
    HermesState state_;
  };

 public:
  Impl(
      FrontendChannel frontendChannel,
      SessionState& /*unused*/,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      HermesRuntime& runtime,
      HermesRuntimeTargetDelegate& runtimeTargetDelegate,
      const RuntimeExecutor& runtimeExecutor)
      : hermes_(hermes::cdp::CDPAgent::create(
            executionContextDescription.id,
            runtimeTargetDelegate.getCDPDebugAPI(),
            // RuntimeTask takes a HermesRuntime whereas our RuntimeExecutor
            // takes a jsi::Runtime.
            [runtimeExecutor,
             &runtime](facebook::hermes::debugger::RuntimeTask fn) {
              runtimeExecutor(
                  [&runtime, fn = std::move(fn)](auto&) { fn(runtime); });
            },
            std::move(frontendChannel),
            HermesStateWrapper::unwrapDestructively(
                previouslyExportedState.get()))) {}

  bool handleRequest(const cdp::PreparsedRequest& req) override {
    // TODO: Change to string::starts_with when we're on C++20.
    if (req.method.rfind("Log.", 0) == 0) {
      // Since we know Hermes doesn't do anything useful with Log messages,
      // but our containing HostAgent will, bail out early.
      // TODO: We need a way to negotiate this more dynamically with Hermes
      // through the API.
      return false;
    }
    // Forward everything else to Hermes's CDPAgent.
    hermes_->handleCommand(req.toJson());
    // Let the call know that this request is handled (i.e. it is Hermes's
    // responsibility to respond with either success or an error).
    return true;
  }

  std::unique_ptr<ExportedState> getExportedState() override {
    return std::make_unique<HermesStateWrapper>(hermes_->getState());
  }

 private:
  std::unique_ptr<hermes::cdp::CDPAgent> hermes_;
};

HermesRuntimeAgentDelegateNew::HermesRuntimeAgentDelegateNew(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription,
    HermesRuntime& runtime,
    HermesRuntimeTargetDelegate& runtimeTargetDelegate,
    RuntimeExecutor runtimeExecutor)
    : impl_(std::make_unique<Impl>(
          std::move(frontendChannel),
          sessionState,
          std::move(previouslyExportedState),
          executionContextDescription,
          runtime,
          runtimeTargetDelegate,
          std::move(runtimeExecutor))) {}

bool HermesRuntimeAgentDelegateNew::handleRequest(
    const cdp::PreparsedRequest& req) {
  return impl_->handleRequest(req);
}

std::unique_ptr<RuntimeAgentDelegate::ExportedState>
HermesRuntimeAgentDelegateNew::getExportedState() {
  return impl_->getExportedState();
}

} // namespace facebook::react::jsinspector_modern

#endif // HERMES_ENABLE_DEBUGGER
