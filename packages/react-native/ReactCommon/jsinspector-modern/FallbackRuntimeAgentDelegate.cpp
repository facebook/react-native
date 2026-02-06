/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FallbackRuntimeAgentDelegate.h"

#include <chrono>
#include <string>
#include <utility>

using namespace std::chrono;
using namespace std::literals::string_view_literals;
using namespace std::literals::string_literals;

namespace facebook::react::jsinspector_modern {

#define ANSI_WEIGHT_BOLD "\x1B[1m"
#define ANSI_WEIGHT_RESET "\x1B[22m"
#define ANSI_STYLE_ITALIC "\x1B[3m"
#define ANSI_STYLE_RESET "\x1B[23m"
#define ANSI_COLOR_BG_YELLOW "\x1B[48;2;253;247;231m"

FallbackRuntimeAgentDelegate::FallbackRuntimeAgentDelegate(
    FrontendChannel frontendChannel,
    const SessionState& sessionState,
    std::string engineDescription)
    : frontendChannel_(std::move(frontendChannel)),
      engineDescription_(std::move(engineDescription)) {
  if (sessionState.isLogDomainEnabled) {
    sendFallbackRuntimeWarning();
  }
}

bool FallbackRuntimeAgentDelegate::handleRequest(
    const cdp::PreparsedRequest& req) {
  if (req.method == "Log.enable") {
    sendFallbackRuntimeWarning();

    // The parent Agent should send a response.
    return false;
  }

  // The parent Agent should send a response or report an error.
  return false;
}

void FallbackRuntimeAgentDelegate::sendFallbackRuntimeWarning() {
  sendWarningLogEntry(
      "The current JavaScript engine, " ANSI_STYLE_ITALIC + engineDescription_ +
      ANSI_STYLE_RESET
      ", does not support debugging over the Chrome DevTools Protocol. "
      "See https://reactnative.dev/docs/debugging for more information.");
}

void FallbackRuntimeAgentDelegate::sendWarningLogEntry(std::string_view text) {
  frontendChannel_(
      cdp::jsonNotification(
          "Log.entryAdded",
          folly::dynamic::object(
              "entry",
              folly::dynamic::object(
                  "timestamp",
                  duration_cast<milliseconds>(
                      system_clock::now().time_since_epoch())
                      .count())("source", "other")("level", "warning")(
                  "text", text))));
}

} // namespace facebook::react::jsinspector_modern
