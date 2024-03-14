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
#define ANSI_STYLE_ITALIC "\x1B[3m"
#define ANSI_STYLE_RESET "\x1B[23m"
#define ANSI_COLOR_BG_YELLOW "\x1B[48;2;253;247;231m"

static constexpr auto kModernCDPBackendNotice =
    ANSI_COLOR_BG_YELLOW ANSI_WEIGHT_BOLD
    "NOTE:" ANSI_WEIGHT_RESET " You are using the " ANSI_STYLE_ITALIC
    "modern" ANSI_STYLE_RESET " CDP backend for React Native (HostTarget)."sv;

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

    // Send a log entry identifying the modern CDP backend.
    sendInfoLogEntry(kModernCDPBackendNotice);

    // Send a log entry with the integration name.
    if (sessionMetadata_.integrationName) {
      sendInfoLogEntry("Integration: " + *sessionMetadata_.integrationName);
    }

    shouldSendOKResponse = true;
    isFinishedHandlingRequest = false;
  } else if (req.method == "Log.disable") {
    sessionState_.isLogDomainEnabled = false;

    shouldSendOKResponse = true;
    isFinishedHandlingRequest = false;
  } else if (req.method == "Runtime.enable") {
    sessionState_.isRuntimeDomainEnabled = true;

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

void HostAgent::sendInfoLogEntry(std::string_view text) {
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

} // namespace facebook::react::jsinspector_modern
