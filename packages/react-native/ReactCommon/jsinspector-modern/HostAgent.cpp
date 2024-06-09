/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpJson.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <jsinspector-modern/HostAgent.h>
#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/InstanceAgent.h>

#include <chrono>

using namespace std::chrono;
using namespace std::literals::string_view_literals;

namespace facebook::react::jsinspector_modern {

#define ANSI_WEIGHT_BOLD "\x1B[1m"
#define ANSI_WEIGHT_RESET "\x1B[22m"
#define ANSI_COLOR_BG_YELLOW "\x1B[48;2;253;247;231m\x1B[30m"

HostAgent::HostAgent(
    FrontendChannel frontendChannel,
    HostTargetController& targetController,
    HostTarget::SessionMetadata sessionMetadata,
    SessionState& sessionState)
    : frontendChannel_(frontendChannel),
      targetController_(targetController),
      sessionMetadata_(std::move(sessionMetadata)),
      networkIO_(targetController.createNetworkHandler()),
      sessionState_(sessionState) {}

void HostAgent::handleRequest(const cdp::PreparsedRequest& req) {
  bool shouldSendOKResponse = false;
  bool isFinishedHandlingRequest = false;

  // Domain enable/disable requests: write to state (because we're the top-level
  // Agent in the Session), trigger any side effects, and decide whether we are
  // finished handling the request (or need to delegate to the InstanceAgent).
  if (req.method == "Log.enable") {
    sessionState_.isLogDomainEnabled = true;

    if (fuseboxClientType_ == FuseboxClientType::Fusebox) {
      sendFuseboxNotice();
    }

    // Send a log entry with the integration name.
    if (sessionMetadata_.integrationName) {
      sendInfoLogEntry(
          ANSI_COLOR_BG_YELLOW "Debugger integration: " +
          *sessionMetadata_.integrationName);
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
      // FuseboxClient.setClientMetadata before enabling the Runtime domain, we
      // can conclude that we're dealing with some other client.
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
        .ignoreCache = req.params.isObject() && req.params.count("ignoreCache")
            ? std::optional(req.params.at("ignoreCache").asBool())
            : std::nullopt,
        .scriptToEvaluateOnLoad =
            req.params.isObject() && req.params.count("scriptToEvaluateOnLoad")
            ? std::optional(req.params.at("scriptToEvaluateOnLoad").asString())
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
  } else if (req.method == "FuseboxClient.setClientMetadata") {
    fuseboxClientType_ = FuseboxClientType::Fusebox;

    if (sessionState_.isLogDomainEnabled) {
      sendFuseboxNotice();
    }

    shouldSendOKResponse = true;
    isFinishedHandlingRequest = true;
  } else if (req.method == "Tracing.start") {
    // @cdp Tracing.start is implemented as a stub only.
    frontendChannel_(cdp::jsonNotification(
        // @cdp Tracing.bufferUsage is implemented as a stub only.
        "Tracing.bufferUsage",
        folly::dynamic::object("percentFull", 0)("eventCount", 0)("value", 0)));
    shouldSendOKResponse = true;
    isFinishedHandlingRequest = true;
  } else if (req.method == "Tracing.end") {
    // @cdp Tracing.end is implemented as a stub only.
    frontendChannel_(cdp::jsonNotification(
        // @cdp Tracing.dataCollected is implemented as a stub only.
        "Tracing.dataCollected",
        folly::dynamic::object("value", folly::dynamic::array())));
    frontendChannel_(cdp::jsonNotification(
        // @cdp Tracing.tracingComplete is implemented as a stub only.
        "Tracing.tracingComplete",
        folly::dynamic::object("dataLossOccurred", false)));
    shouldSendOKResponse = true;
    isFinishedHandlingRequest = true;
  } else if (req.method == "Network.loadNetworkResource") {
    handleLoadNetworkResource(req);
    return;
  } else if (req.method == "IO.read") {
    handleIoRead(req);
    return;
  } else if (req.method == "IO.close") {
    handleIoClose(req);
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

void HostAgent::handleLoadNetworkResource(const cdp::PreparsedRequest& req) {
  long long requestId = req.id;
  auto res = folly::dynamic::object("id", requestId);
  if (!req.params.isObject()) {
    frontendChannel_(cdp::jsonError(
        req.id,
        cdp::ErrorCode::InvalidParams,
        "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("url") == 0u) || !req.params.at("url").isString()) {
    frontendChannel_(cdp::jsonError(
        requestId,
        cdp::ErrorCode::InvalidParams,
        "Invalid params: url is missing or not a string."));
    return;
  }

  networkIO_->loadNetworkResource(
      {.url = req.params.at("url").asString()},
      targetController_.getDelegate(),
      // This callback is always called, with resource.success=false on failure.
      [requestId,
       frontendChannel = frontendChannel_](NetworkResource resource) {
        auto dynamicResource =
            folly::dynamic::object("success", resource.success);

        if (resource.stream) {
          dynamicResource("stream", *resource.stream);
        }

        if (resource.netErrorName) {
          dynamicResource("netErrorName", *resource.netErrorName);
        }

        if (resource.httpStatusCode) {
          dynamicResource("httpStatusCode", *resource.httpStatusCode);
        }

        if (resource.headers) {
          auto dynamicHeaders = folly::dynamic::object();
          for (const auto& pair : *resource.headers) {
            dynamicHeaders(pair.first, pair.second);
          }
          dynamicResource("headers", std::move(dynamicHeaders));
        }

        frontendChannel(cdp::jsonResult(
            requestId,
            folly::dynamic::object("resource", std::move(dynamicResource))));
      });
}

void HostAgent::handleIoRead(const cdp::PreparsedRequest& req) {
  long long requestId = req.id;
  if (!req.params.isObject()) {
    frontendChannel_(cdp::jsonError(
        requestId,
        cdp::ErrorCode::InvalidParams,
        "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("handle") == 0u) ||
      !req.params.at("handle").isString()) {
    frontendChannel_(cdp::jsonError(
        requestId,
        cdp::ErrorCode::InvalidParams,
        "Invalid params: handle is missing or not a string."));
    return;
  }
  std::optional<unsigned long> size = std::nullopt;
  if ((req.params.count("size") != 0u) && req.params.at("size").isInt()) {
    size = req.params.at("size").asInt();
  }
  networkIO_->readStream(
      {.handle = req.params.at("handle").asString(), .size = size},
      [requestId, frontendChannel = frontendChannel_](
          std::variant<IOReadError, IOReadResult> resultOrError) {
        if (std::holds_alternative<IOReadError>(resultOrError)) {
          frontendChannel(cdp::jsonError(
              requestId,
              cdp::ErrorCode::InternalError,
              std::get<IOReadError>(resultOrError)));
        } else {
          const auto& result = std::get<IOReadResult>(resultOrError);
          auto stringResult = cdp::jsonResult(
              requestId,
              folly::dynamic::object("data", result.data)("eof", result.eof)(
                  "base64Encoded", result.base64Encoded));
          frontendChannel(stringResult);
        }
      });
}

void HostAgent::handleIoClose(const cdp::PreparsedRequest& req) {
  long long requestId = req.id;
  if (!req.params.isObject()) {
    frontendChannel_(cdp::jsonError(
        requestId,
        cdp::ErrorCode::InvalidParams,
        "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("handle") == 0u) ||
      !req.params.at("handle").isString()) {
    frontendChannel_(cdp::jsonError(
        requestId,
        cdp::ErrorCode::InvalidParams,
        "Invalid params: handle is missing or not a string."));
    return;
  }
  networkIO_->closeStream(
      req.params.at("handle").asString(),
      [requestId, frontendChannel = frontendChannel_](
          std::optional<std::string> maybeError) {
        if (maybeError) {
          frontendChannel(cdp::jsonError(
              requestId, cdp::ErrorCode::InternalError, *maybeError));
        } else {
          frontendChannel(cdp::jsonResult(requestId));
        }
      });
}

HostAgent::~HostAgent() {
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

void HostAgent::sendFuseboxNotice() {
  static constexpr auto kFuseboxNotice = ANSI_COLOR_BG_YELLOW
      "Welcome to " ANSI_WEIGHT_BOLD "React Native DevTools" ANSI_WEIGHT_RESET
      " (experimental)"sv;

  sendInfoLogEntry(kFuseboxNotice);
}

void HostAgent::sendNonFuseboxNotice() {
  static constexpr auto kNonFuseboxNotice =
      ANSI_COLOR_BG_YELLOW ANSI_WEIGHT_BOLD
      "NOTE: " ANSI_WEIGHT_RESET
      "You are using an unsupported debugging client. "
      "Use the Dev Menu in your app (or type `j` in the Metro terminal) to open the latest, supported React Native debugger."sv;

  std::vector<std::string> args;
  args.emplace_back(kNonFuseboxNotice);
  sendConsoleMessage({ConsoleAPIType::kInfo, args});
}

void HostAgent::sendInfoLogEntry(
    std::string_view text,
    std::initializer_list<std::string_view> args) {
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

void HostAgent::setCurrentInstanceAgent(
    std::shared_ptr<InstanceAgent> instanceAgent) {
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
    frontendChannel_(cdp::jsonNotification("Runtime.executionContextsCleared"));
  }
  if (instanceAgent_) {
    // TODO: Send Runtime.executionContextCreated here - at the moment we expect
    // the runtime to do it for us.
  }
}

void HostAgent::sendConsoleMessage(SimpleConsoleMessage message) {
  if (instanceAgent_) {
    instanceAgent_->sendConsoleMessage(std::move(message));
  } else {
    // Will be sent by the InstanceAgent eventually.
    sessionState_.pendingSimpleConsoleMessages.emplace_back(std::move(message));
  }
}

} // namespace facebook::react::jsinspector_modern
