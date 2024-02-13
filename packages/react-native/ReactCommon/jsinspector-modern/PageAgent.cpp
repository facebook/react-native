/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/json.h>
#include <jsinspector-modern/InstanceAgent.h>
#include <jsinspector-modern/PageAgent.h>
#include <jsinspector-modern/PageTarget.h>

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
    "modern" ANSI_STYLE_RESET " CDP backend for React Native (PageTarget)."sv;

PageAgent::PageAgent(
    FrontendChannel frontendChannel,
    PageTargetController& targetController,
    PageTarget::SessionMetadata sessionMetadata,
    SessionState& sessionState)
    : frontendChannel_(frontendChannel),
      targetController_(targetController),
      sessionMetadata_(std::move(sessionMetadata)),
      sessionState_(sessionState) {}

void PageAgent::handleRequest(const cdp::PreparsedRequest& req) {
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
    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);
    return;
  }

  folly::dynamic res = folly::dynamic::object("id", req.id)(
      "error",
      folly::dynamic::object("code", -32601)(
          "message", req.method + " not implemented yet"));
  std::string json = folly::toJson(res);
  frontendChannel_(json);
}

void PageAgent::sendInfoLogEntry(std::string_view text) {
  frontendChannel_(
      folly::toJson(folly::dynamic::object("method", "Log.entryAdded")(
          "params",
          folly::dynamic::object(
              "entry",
              folly::dynamic::object(
                  "timestamp",
                  duration_cast<milliseconds>(
                      system_clock::now().time_since_epoch())
                      .count())("source", "other")(
                  "level", "info")("text", text)))));
}

void PageAgent::setCurrentInstanceAgent(
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
    folly::dynamic contextsCleared =
        folly::dynamic::object("method", "Runtime.executionContextsCleared");
    frontendChannel_(folly::toJson(contextsCleared));
  }
  if (instanceAgent_) {
    // TODO: Send Runtime.executionContextCreated here - at the moment we expect
    // the runtime to do it for us.
  }
}

} // namespace facebook::react::jsinspector_modern
