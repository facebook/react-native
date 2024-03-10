/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeAgentDelegateNew.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDP headers or types.

#ifdef HERMES_ENABLE_DEBUGGER
#include <hermes/AsyncDebuggerAPI.h>
#include <hermes/cdp/CDPAgent.h>
#include <hermes/inspector/RuntimeAdapter.h>
#else // HERMES_ENABLE_DEBUGGER
#include <jsinspector-modern/FallbackRuntimeAgentDelegate.h>
#endif // HERMES_ENABLE_DEBUGGER

#include <hermes/hermes.h>
#include <jsinspector-modern/ReactCdp.h>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

#ifdef HERMES_ENABLE_DEBUGGER

class HermesRuntimeAgentDelegateNew::Impl final : public RuntimeAgentDelegate {
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
            std::move(frontendChannel))) {
    // TODO(T178858701): Pass previouslyExportedState to CDPAgent
    (void)previouslyExportedState;
  }

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   * \returns true if this agent has responded, or will respond asynchronously,
   * to the request (with either a success or error message). False if the
   * agent expects another agent to respond to the request instead.
   */
  bool handleRequest(const cdp::PreparsedRequest& req) override {
    // TODO: Change to string::starts_with when we're on C++20.
    if (req.method.rfind("Log.", 0) == 0) {
      // Since we know Hermes doesn't do anything useful with Log messages, but
      // our containing PageAgent will, just bail out early.
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

 private:
  std::unique_ptr<hermes::cdp::CDPAgent> hermes_;
};

#else // !HERMES_ENABLE_DEBUGGER

/**
 * A stub for HermesRuntimeAgentDelegateNew when Hermes is compiled without
 * debugging support.
 */
class HermesRuntimeAgentDelegateNew::Impl final
    : public FallbackRuntimeAgentDelegate {
 public:
  Impl(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
      const ExecutionContextDescription&,
      HermesRuntime& runtime,
      HermesRuntimeTargetDelegate& runtimeTargetDelegate,
      RuntimeExecutor)
      : FallbackRuntimeAgentDelegate(
            std::move(frontendChannel),
            sessionState,
            runtime.description()) {}
};

#endif // HERMES_ENABLE_DEBUGGER

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

} // namespace facebook::react::jsinspector_modern
