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
    PageTarget::SessionMetadata sessionMetadata)
    : frontendChannel_(frontendChannel),
      targetController_(targetController),
      sessionMetadata_(std::move(sessionMetadata)) {}

void PageAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Log.enable") {
    // Send an "OK" response.
    frontendChannel_(
        folly::toJson(folly::dynamic::object("id", req.id)("result", nullptr)));

    // Send a log entry identifying the modern CDP backend.
    sendInfoLogEntry(kModernCDPBackendNotice);

    // Send a log entry with the integration name.
    if (sessionMetadata_.integrationName) {
      sendInfoLogEntry("Integration: " + *sessionMetadata_.integrationName);
    }

    return;
  }

  if (req.method == "Page.reload") {
    targetController_.getDelegate().onReload({
        .ignoreCache = req.params.isObject() && req.params.count("ignoreCache")
            ? std::optional(req.params.at("ignoreCache").asBool())
            : std::nullopt,
        .scriptToEvaluateOnLoad =
            req.params.isObject() && req.params.count("scriptToEvaluateOnLoad")
            ? std::optional(req.params.at("scriptToEvaluateOnLoad").asString())
            : std::nullopt,
    });
    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);
    return;
  }

  if (req.method == "Runtime.enable") {
    runtimeEnabled_ = true;

    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);

    if (instanceAgent_) {
      folly::dynamic params = folly::dynamic::object(
          "context",
          folly::dynamic::object("id", instanceAgent_->getExecutionContextId())(
              "origin", "")("name", "React Native"));
      folly::dynamic contextCreated = folly::dynamic::object(
          "method", "Runtime.executionContextCreated")("params", params);
      frontendChannel_(folly::toJson(contextCreated));
    }
    return;
  }
  if (req.method == "Runtime.disable") {
    runtimeEnabled_ = false;
    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);
    return;
  }

  if (instanceAgent_ && instanceAgent_->handleRequest(req)) {
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
    std::unique_ptr<InstanceAgent> instanceAgent) {
  auto previousInstanceAgent = std::move(instanceAgent_);
  instanceAgent_ = std::move(instanceAgent);
  if (!runtimeEnabled_) {
    return;
  }
  if (previousInstanceAgent != nullptr) {
    auto executionContextId = previousInstanceAgent->getExecutionContextId();
    folly::dynamic contextDestroyed =
        folly::dynamic::object("method", "Runtime.executionContextDestroyed")(
            "params",
            folly::dynamic::object("executionContextId", executionContextId));
    frontendChannel_(folly::toJson(contextDestroyed));

    // Because we can only have a single instance, we can report all contexts
    // as cleared.
    folly::dynamic contextsCleared =
        folly::dynamic::object("method", "Runtime.executionContextsCleared");
    frontendChannel_(folly::toJson(contextsCleared));
  }
  if (instanceAgent_) {
    folly::dynamic params = folly::dynamic::object(
        "context",
        folly::dynamic::object("id", instanceAgent_->getExecutionContextId())(
            "origin", "")("name", "React Native"));
    folly::dynamic contextCreated = folly::dynamic::object(
        "method", "Runtime.executionContextCreated")("params", params);
    frontendChannel_(folly::toJson(contextCreated));
  }
}

} // namespace facebook::react::jsinspector_modern
