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
#define ANSI_COLOR_BG_YELLOW "\x1B[48;2;253;247;231m"
#define CSS_STYLE_PLACEHOLDER "%c"

HostAgent::HostAgent(
    FrontendChannel frontendChannel,
    HostTargetController& targetController,
    HostTarget::SessionMetadata sessionMetadata,
    SessionState& sessionState)
    : frontendChannel_(frontendChannel),
      targetController_(targetController),
      sessionMetadata_(std::move(sessionMetadata)),
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
  } else if (req.method == "FuseboxClient.setClientMetadata") {
    fuseboxClientType_ = FuseboxClientType::Fusebox;

    if (sessionState_.isLogDomainEnabled) {
      sendFuseboxNotice();
    }

    shouldSendOKResponse = true;
    isFinishedHandlingRequest = true;
  }

  if (!isFinishedHandlingRequest && instanceAgent_ &&
      instanceAgent_->handleRequest(req)) {
    return;
  }

  if (shouldSendOKResponse) {
    frontendChannel_(cdp::jsonResult(req.id));
    return;
  }

  frontendChannel_(cdp::jsonError(
      req.id,
      cdp::ErrorCode::MethodNotFound,
      req.method + " not implemented yet"));
}

void HostAgent::sendFuseboxNotice() {
  static constexpr auto kFuseboxNotice = ANSI_COLOR_BG_YELLOW
      "Welcome to the new React Native debugger (codename " ANSI_WEIGHT_BOLD
      "React Fusebox " CSS_STYLE_PLACEHOLDER
      "⚡️" CSS_STYLE_PLACEHOLDER ANSI_WEIGHT_RESET ")."sv;

  sendInfoLogEntry(
      kFuseboxNotice, {"font-family: sans-serif;", "font-family: monospace;"});
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
                  .count())("source", "other")(
              "level", "info")("text", text)("args", std::move(argsArray)))));
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
