/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostAgent.h"
#include "InstanceAgent.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include "NetworkIOAgent.h"
#include "SessionState.h"
#include "TracingAgent.h"
#endif // REACT_NATIVE_DEBUGGER_ENABLED

#include <folly/dynamic.h>
#include <folly/json.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <chrono>
#include <functional>
#include <string_view>

using namespace std::chrono;
using namespace std::literals::string_view_literals;

namespace facebook::react::jsinspector_modern {

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

#define ANSI_WEIGHT_BOLD "\x1B[1m"
#define ANSI_WEIGHT_RESET "\x1B[22m"
#define ANSI_COLOR_BG_YELLOW "\x1B[48;2;253;247;231m\x1B[30m"

class HostAgent::Impl final {
 public:
  explicit Impl(
      HostAgent& hostAgent,
      FrontendChannel frontendChannel,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata,
      SessionState& sessionState,
      VoidExecutor executor)
      : frontendChannel_(frontendChannel),
        targetController_(targetController),
        hostMetadata_(std::move(hostMetadata)),
        sessionState_(sessionState),
        networkIOAgent_(NetworkIOAgent(frontendChannel, std::move(executor))),
        tracingAgent_(TracingAgent(frontendChannel)) {}

  ~Impl() {
    if (isPausedInDebuggerOverlayVisible_) {
      // In case of a non-graceful shutdown of the session, ensure we clean up
      // the "paused on debugger" overlay if we've previously asked the
      // integrator to display it.
      isPausedInDebuggerOverlayVisible_ = false;
      if (!targetController_.decrementPauseOverlayCounter()) {
        targetController_.getDelegate().onSetPausedInDebuggerMessage({
            .message = std::nullopt,
        });
      }
    }
  }

  void handleRequest(const cdp::PreparsedRequest& req) {
    bool shouldSendOKResponse = false;
    bool isFinishedHandlingRequest = false;

    // Domain enable/disable requests: write to state (because we're the
    // top-level Agent in the Session), trigger any side effects, and decide
    // whether we are finished handling the request (or need to delegate to the
    // InstanceAgent).
    if (req.method == "Log.enable") {
      sessionState_.isLogDomainEnabled = true;

      if (fuseboxClientType_ == FuseboxClientType::Fusebox) {
        sendFuseboxNotice();
      }

      // Send a log entry with the integration name.
      if (hostMetadata_.integrationName) {
        sendInfoLogEntry(
            ANSI_COLOR_BG_YELLOW "Debugger integration: " +
            *hostMetadata_.integrationName);
      }

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = false;
    } else if (req.method == "Log.disable") {
      sessionState_.isLogDomainEnabled = false;

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = false;
    } else if (req.method == "Runtime.enable") {
      sessionState_.isRuntimeDomainEnabled = true;

      if (fuseboxClientType_ == FuseboxClientType::Unknown) {
        // Since we know the Fusebox frontend sends
        // FuseboxClient.setClientMetadata before enabling the Runtime domain,
        // we can conclude that we're dealing with some other client.
        fuseboxClientType_ = FuseboxClientType::NonFusebox;
        sendNonFuseboxNotice();
      }

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = false;
    } else if (req.method == "Runtime.disable") {
      sessionState_.isRuntimeDomainEnabled = false;

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = false;
    } else if (req.method == "Debugger.enable") {
      sessionState_.isDebuggerDomainEnabled = true;

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = false;
    } else if (req.method == "Debugger.disable") {
      sessionState_.isDebuggerDomainEnabled = false;

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = false;
    }
    // Methods other than domain enables/disables: handle anything we know how
    // to handle, and delegate to the InstanceAgent otherwise.
    else if (req.method == "Page.reload") {
      targetController_.getDelegate().onReload({
          .ignoreCache =
              req.params.isObject() && req.params.count("ignoreCache")
              ? std::optional(req.params.at("ignoreCache").asBool())
              : std::nullopt,
          .scriptToEvaluateOnLoad = req.params.isObject() &&
                  req.params.count("scriptToEvaluateOnLoad")
              ? std::optional(
                    req.params.at("scriptToEvaluateOnLoad").asString())
              : std::nullopt,
      });

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = true;
    } else if (req.method == "Overlay.setPausedInDebuggerMessage") {
      auto message = req.params.isObject() && req.params.count("message")
          ? std::optional(req.params.at("message").asString())
          : std::nullopt;
      if (!isPausedInDebuggerOverlayVisible_ && message.has_value()) {
        targetController_.incrementPauseOverlayCounter();
      } else if (isPausedInDebuggerOverlayVisible_ && !message.has_value()) {
        targetController_.decrementPauseOverlayCounter();
      }
      isPausedInDebuggerOverlayVisible_ = message.has_value();
      targetController_.getDelegate().onSetPausedInDebuggerMessage({
          .message = message,
      });

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = true;
    } else if (req.method == "ReactNativeApplication.enable") {
      sessionState_.isReactNativeApplicationDomainEnabled = true;
      fuseboxClientType_ = FuseboxClientType::Fusebox;

      if (sessionState_.isLogDomainEnabled) {
        sendFuseboxNotice();
      }

      frontendChannel_(cdp::jsonNotification(
          "ReactNativeApplication.metadataUpdated",
          createHostMetadataPayload(hostMetadata_)));

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = true;
    } else if (req.method == "ReactNativeApplication.disable") {
      sessionState_.isReactNativeApplicationDomainEnabled = false;

      shouldSendOKResponse = true;
      isFinishedHandlingRequest = true;
    } else if (req.method == "Tracing.start") {
      if (sessionState_.isDebuggerDomainEnabled) {
        frontendChannel_(cdp::jsonError(
            req.id,
            cdp::ErrorCode::InternalError,
            "Debugger domain is expected to be disabled before starting Tracing"));

        return;
      }

      // We delegate handling of this request to TracingAgent. If not handled,
      // then something unexpected happened - don't send an OK response.
      shouldSendOKResponse = false;
      isFinishedHandlingRequest = false;
    }

    if (!isFinishedHandlingRequest &&
        networkIOAgent_.handleRequest(req, targetController_.getDelegate())) {
      return;
    }

    if (!isFinishedHandlingRequest && tracingAgent_.handleRequest(req)) {
      return;
    }

    if (!isFinishedHandlingRequest && instanceAgent_ &&
        instanceAgent_->handleRequest(req)) {
      return;
    }

    if (shouldSendOKResponse) {
      frontendChannel_(cdp::jsonResult(req.id));
      return;
    }

    throw NotImplementedException(req.method);
  }

  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> instanceAgent) {
    tracingAgent_.setCurrentInstanceAgent(instanceAgent);

    auto previousInstanceAgent = std::move(instanceAgent_);
    instanceAgent_ = std::move(instanceAgent);

    if (!sessionState_.isRuntimeDomainEnabled) {
      return;
    }
    if (previousInstanceAgent != nullptr) {
      // TODO: Send Runtime.executionContextDestroyed here - at the moment we
      // expect the runtime to do it for us.

      // Because we can only have a single instance, we can report all contexts
      // as cleared.
      frontendChannel_(
          cdp::jsonNotification("Runtime.executionContextsCleared"));
    }
    if (instanceAgent_) {
      // TODO: Send Runtime.executionContextCreated here - at the moment we
      // expect the runtime to do it for us.
    }
  }

 private:
  enum class FuseboxClientType { Unknown, Fusebox, NonFusebox };

  /**
   * Send a simple Log.entryAdded notification with the given
   * \param text. You must ensure that the frontend has enabled Log
   * notifications (using Log.enable) prior to calling this function. In Chrome
   * DevTools, the message will appear in the Console tab along with regular
   * console messages. The difference between Log.entryAdded and
   * Runtime.consoleAPICalled is that the latter requires an execution context
   * ID, which does not exist at the Host level.
   */
  void sendInfoLogEntry(
      std::string_view text,
      std::initializer_list<std::string_view> args = {}) {
    folly::dynamic argsArray = folly::dynamic::array();
    for (auto arg : args) {
      argsArray.push_back(arg);
    }
    frontendChannel_(cdp::jsonNotification(
        "Log.entryAdded",
        folly::dynamic::object(
            "entry",
            folly::dynamic::object(
                "timestamp",
                duration_cast<milliseconds>(
                    system_clock::now().time_since_epoch())
                    .count())("source", "other")("level", "info")("text", text)(
                "args", std::move(argsArray)))));
  }

  void sendFuseboxNotice() {
    static constexpr auto kFuseboxNotice =
        ANSI_COLOR_BG_YELLOW "Welcome to " ANSI_WEIGHT_BOLD
                             "React Native DevTools" ANSI_WEIGHT_RESET ""sv;

    sendInfoLogEntry(kFuseboxNotice);
  }

  void sendNonFuseboxNotice() {
    static constexpr auto kNonFuseboxNotice =
        ANSI_COLOR_BG_YELLOW ANSI_WEIGHT_BOLD
        "NOTE: " ANSI_WEIGHT_RESET
        "You are using an unsupported debugging client. "
        "Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools."sv;

    std::vector<std::string> args;
    args.emplace_back(kNonFuseboxNotice);
    sendConsoleMessage({ConsoleAPIType::kInfo, args});
  }

  /**
   * Send a console message to the frontend, or buffer it to be sent later.
   */
  void sendConsoleMessage(SimpleConsoleMessage message) {
    if (instanceAgent_) {
      instanceAgent_->sendConsoleMessage(std::move(message));
    } else {
      // Will be sent by the InstanceAgent eventually.
      sessionState_.pendingSimpleConsoleMessages.emplace_back(
          std::move(message));
    }
  }

  FrontendChannel frontendChannel_;
  HostTargetController& targetController_;
  const HostTargetMetadata hostMetadata_;
  std::shared_ptr<InstanceAgent> instanceAgent_;
  FuseboxClientType fuseboxClientType_{FuseboxClientType::Unknown};
  bool isPausedInDebuggerOverlayVisible_{false};

  /**
   * A shared reference to the session's state. This is only safe to access
   * during handleRequest and other method calls on the same thread.
   */
  SessionState& sessionState_;

  NetworkIOAgent networkIOAgent_;

  TracingAgent tracingAgent_;
};

#else

/**
 * A stub for HostAgent when React Native is compiled without debugging
 * support.
 */
class HostAgent::Impl final {
 public:
  explicit Impl(
      HostAgent&,
      FrontendChannel frontendChannel,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata,
      SessionState& sessionState,
      VoidExecutor executor) {}

  void handleRequest(const cdp::PreparsedRequest& req) {}
  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> agent) {}
};

#endif // REACT_NATIVE_DEBUGGER_ENABLED

HostAgent::HostAgent(
    const FrontendChannel& frontendChannel,
    HostTargetController& targetController,
    HostTargetMetadata hostMetadata,
    SessionState& sessionState,
    VoidExecutor executor)
    : impl_(std::make_unique<Impl>(
          *this,
          frontendChannel,
          targetController,
          std::move(hostMetadata),
          sessionState,
          std::move(executor))) {}

HostAgent::~HostAgent() = default;

void HostAgent::handleRequest(const cdp::PreparsedRequest& req) {
  impl_->handleRequest(req);
}

void HostAgent::setCurrentInstanceAgent(
    std::shared_ptr<InstanceAgent> instanceAgent) {
  impl_->setCurrentInstanceAgent(std::move(instanceAgent));
}

} // namespace facebook::react::jsinspector_modern
