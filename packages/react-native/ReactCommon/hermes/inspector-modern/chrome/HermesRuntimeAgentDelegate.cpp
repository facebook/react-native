/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef HERMES_ENABLE_DEBUGGER

#include "HermesRuntimeAgentDelegate.h"

#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/CDPHandler.h>

#include <hermes/hermes.h>
#include <jsinspector-modern/CdpJson.h>
#include <jsinspector-modern/ReactCdp.h>

#include <chrono>

using namespace facebook::hermes;
using namespace std::chrono;

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * An implementation of the Hermes RuntimeAdapter interface (part of
 * Hermes's CDPHandler API) for use within a React Native RuntimeAgentDelegate.
 */
class HermesRuntimeAgentDelegateAdapter
    : public hermes::inspector_modern::RuntimeAdapter {
 public:
  HermesRuntimeAgentDelegateAdapter(
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
 * A RuntimeAgentDelegate that handles requests from the Chrome DevTools
 * Protocol for an instance of Hermes.
 */
class HermesRuntimeAgentDelegate::Impl final : public RuntimeAgentDelegate {
  using HermesCDPHandler = hermes::inspector_modern::chrome::CDPHandler;
  using HermesExecutionContextDescription =
      hermes::inspector_modern::chrome::CDPHandlerExecutionContextDescription;
  using HermesState = hermes::inspector_modern::chrome::State;

  struct HermesStateWrapper : public ExportedState {
    explicit HermesStateWrapper(std::unique_ptr<HermesState> state)
        : state_(std::move(state)) {}

    static std::unique_ptr<HermesState> unwrapDestructively(
        ExportedState* wrapper) {
      if (!wrapper) {
        return nullptr;
      }
      if (auto* typedWrapper = dynamic_cast<HermesStateWrapper*>(wrapper)) {
        return std::move(typedWrapper->state_);
      }
      return nullptr;
    }

   private:
    std::unique_ptr<HermesState> state_;
  };

 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param sessionState The state of the current CDP session. This will only
   * be accessed on the main thread (during the constructor, in handleRequest,
   * etc).
   * \param previouslyExportedState The exported state from a previous instance
   * of RuntimeAgentDelegate (NOT necessarily HermesRuntimeAgentDelegate). This
   * may be nullptr, and if not nullptr it may be of any concrete type that
   * implements RuntimeAgentDelegate::ExportedState.
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param runtime The HermesRuntime that this agent is attached to.
   * \param runtimeExecutor A callback for scheduling work on the JS thread.
   * \c runtimeExecutor may drop scheduled work if the runtime is destroyed
   * first.
   */
  Impl(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      std::shared_ptr<hermes::HermesRuntime> runtime,
      RuntimeExecutor runtimeExecutor)
      : hermes_(HermesCDPHandler::create(
            std::make_unique<HermesRuntimeAgentDelegateAdapter>(
                runtime,
                runtimeExecutor),
            /* waitForDebugger */ false,
            /* enableConsoleAPICapturing */ false,
            /* state */
            HermesStateWrapper::unwrapDestructively(
                previouslyExportedState.get()),
            {.isRuntimeDomainEnabled = sessionState.isRuntimeDomainEnabled},
            HermesExecutionContextDescription{
                .id = executionContextDescription.id,
                .origin = executionContextDescription.origin,
                .name = executionContextDescription.name,
                .auxData = std::nullopt,
                .shouldSendNotifications = false})),
        frontendChannel_(std::move(frontendChannel)) {
    if (sessionState.isLogDomainEnabled) {
      sendHermesIntegrationDescription();
    }
    hermes_->registerCallbacks(
        /* msgCallback */
        [frontendChannel =
             frontendChannel_](const std::string& messageFromHermes) {
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
    if (req.method == "Log.enable") {
      sendHermesIntegrationDescription();

      // The parent Agent should send a response.
      return false;
    }

    // TODO: Change to string::starts_with when we're on C++20.
    if (req.method.rfind("Log.", 0) == 0) {
      // Since we know Hermes doesn't do anything useful with Log messages, but
      // our containing HostAgent will, just bail out early.
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

  virtual std::unique_ptr<ExportedState> getExportedState() override {
    return std::make_unique<HermesStateWrapper>(hermes_->getState());
  }

 private:
  /**
   * Send a user-facing message describing the current Hermes integration. You
   * must ensure that the frontend has enabled Log notifications (using
   * Log.enable) prior to calling this function.
   */
  void sendHermesIntegrationDescription() {
    sendInfoLogEntry("Hermes integration: CDPHandler");
  }

  /**
   * Send a simple Log.entryAdded notification with the given
   * \param text. You must ensure that the frontend has enabled Log
   * notifications (using Log.enable) prior to calling this function. In Chrome
   * DevTools, the message will appear in the Console tab along with regular
   * console messages.
   */
  void sendInfoLogEntry(std::string_view text) {
    frontendChannel_(cdp::jsonNotification(
        "Log.entryAdded",
        folly::dynamic::object(
            "entry",
            folly::dynamic::object(
                "timestamp",
                duration_cast<milliseconds>(
                    system_clock::now().time_since_epoch())
                    .count())("source", "other")(
                "level", "info")("text", text))));
  }

  std::shared_ptr<HermesCDPHandler> hermes_;
  FrontendChannel frontendChannel_;
};

HermesRuntimeAgentDelegate::HermesRuntimeAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription,
    std::shared_ptr<hermes::HermesRuntime> runtime,
    RuntimeExecutor runtimeExecutor)
    : impl_(std::make_unique<Impl>(
          std::move(frontendChannel),
          sessionState,
          std::move(previouslyExportedState),
          executionContextDescription,
          std::move(runtime),
          std::move(runtimeExecutor))) {}

bool HermesRuntimeAgentDelegate::handleRequest(
    const cdp::PreparsedRequest& req) {
  return impl_->handleRequest(req);
}

std::unique_ptr<HermesRuntimeAgentDelegate::ExportedState>
HermesRuntimeAgentDelegate::getExportedState() {
  return impl_->getExportedState();
}

} // namespace facebook::react::jsinspector_modern

#endif // HERMES_ENABLE_DEBUGGER
