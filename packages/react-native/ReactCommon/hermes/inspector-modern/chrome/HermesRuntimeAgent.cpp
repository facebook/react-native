/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeAgent.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDPHandler headers or types.

#ifdef HERMES_ENABLE_DEBUGGER
#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/CDPHandler.h>
#else // HERMES_ENABLE_DEBUGGER
#include <jsinspector-modern/FallbackRuntimeAgent.h>
#endif // HERMES_ENABLE_DEBUGGER

#include <hermes/hermes.h>
#include <jsinspector-modern/ReactCdp.h>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

#ifdef HERMES_ENABLE_DEBUGGER

namespace {

/**
 * An implementation of the Hermes RuntimeAdapter interface (part of
 * Hermes's CDPHandler API) for use within a React Native RuntimeAgent.
 */
class HermesRuntimeAgentAdapter
    : public hermes::inspector_modern::RuntimeAdapter {
 public:
  HermesRuntimeAgentAdapter(
      std::shared_ptr<hermes::HermesRuntime> runtime,
      RuntimeExecutor runtimeExecutor)
      : runtime_(runtime), runtimeExecutor_(runtimeExecutor) {}

  HermesRuntime& getRuntime() override {
    return *runtime_;
  }

  void tickleJs() override {
    runtimeExecutor_([](jsi::Runtime& runtime) {
      jsi::Function func =
          runtime.global().getPropertyAsFunction(runtime, "__tickleJs");
      func.call(runtime);
    });
  }

 private:
  std::shared_ptr<hermes::HermesRuntime> runtime_;
  RuntimeExecutor runtimeExecutor_;
};

} // namespace

/**
 * A RuntimeAgent that handles requests from the Chrome DevTools Protocol for
 * an instance of Hermes.
 */
class HermesRuntimeAgent::Impl final : public RuntimeAgent {
  using HermesCDPHandler = hermes::inspector_modern::chrome::CDPHandler;

 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param sessionState The state of the current CDP session. This will only
   * be accessed on the main thread (during the constructor, in handleRequest,
   * etc).
   * \param runtime The HermesRuntime that this agent is attached to.
   * \param runtimeExecutor A callback for scheduling work on the JS thread.
   * \c runtimeExecutor may drop scheduled work if the runtime is destroyed
   * first.
   */
  Impl(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::shared_ptr<hermes::HermesRuntime> runtime,
      RuntimeExecutor runtimeExecutor)
      : hermes_(HermesCDPHandler::create(
            std::make_unique<HermesRuntimeAgentAdapter>(
                runtime,
                runtimeExecutor),
            /* waitForDebugger */ false,
            /* enableConsoleAPICapturing */ false,
            /* state */ nullptr,
            {.isRuntimeDomainEnabled = sessionState.isRuntimeDomainEnabled})) {
    hermes_->registerCallbacks(
        /* msgCallback */
        [frontendChannel =
             std::move(frontendChannel)](const std::string& messageFromHermes) {
          frontendChannel(messageFromHermes);
          ;
        },
        /* onUnregister */
        []() {});
  }

  /**
   * Handle a CDP request.  The response will be sent over the provided
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
    // Forward everything else to Hermes's CDPHandler.
    hermes_->handle(req.toJson());
    // Let the call know that this request is handled (i.e. it is Hermes's
    // responsibility to respond with either success or an error).
    return true;
  }

 private:
  std::shared_ptr<HermesCDPHandler> hermes_;
};

#else // !HERMES_ENABLE_DEBUGGER

/**
 * A stub for HermesRuntimeAgent when Hermes is compiled without debugging
 * support.
 */
class HermesRuntimeAgent::Impl final : public FallbackRuntimeAgent {
 public:
  Impl(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::shared_ptr<hermes::HermesRuntime> runtime,
      RuntimeExecutor)
      : FallbackRuntimeAgent(
            std::move(frontendChannel),
            sessionState,
            runtime->description()) {}
};

#endif // HERMES_ENABLE_DEBUGGER

HermesRuntimeAgent::HermesRuntimeAgent(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::shared_ptr<hermes::HermesRuntime> runtime,
    RuntimeExecutor runtimeExecutor)
    : impl_(std::make_unique<Impl>(
          std::move(frontendChannel),
          sessionState,
          std::move(runtime),
          std::move(runtimeExecutor))) {}

bool HermesRuntimeAgent::handleRequest(const cdp::PreparsedRequest& req) {
  return impl_->handleRequest(req);
}

} // namespace facebook::react::jsinspector_modern
