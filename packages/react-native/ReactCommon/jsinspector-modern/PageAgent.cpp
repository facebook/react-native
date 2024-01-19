/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/json.h>
#include <jsinspector-modern/PageAgent.h>

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

PageAgent::PageAgent(FrontendChannel frontendChannel)
    : frontendChannel_(frontendChannel) {}

void PageAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Log.enable") {
    // Send an "OK" response.
    frontendChannel_(
        folly::toJson(folly::dynamic::object("id", req.id)("result", nullptr)));

    // Send a log entry identifying the modern CDP backend.
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
                    "level", "info")("text", kModernCDPBackendNotice)))));

    return;
  }
  folly::dynamic res = folly::dynamic::object("id", req.id)(
      "error",
      folly::dynamic::object("code", -32601)(
          "message", req.method + " not implemented yet"));
  std::string json = folly::toJson(res);
  frontendChannel_(json);
}

} // namespace facebook::react::jsinspector_modern
