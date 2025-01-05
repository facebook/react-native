/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingAgent.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>

namespace facebook::react::jsinspector_modern {

bool TracingAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Tracing.start") {
    // @cdp Tracing.start support is experimental.
    if (PerformanceTracer::getInstance().startTracing()) {
      frontendChannel_(cdp::jsonResult(req.id));
    } else {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Tracing session already started"));
    }

    return true;
  } else if (req.method == "Tracing.end") {
    // @cdp Tracing.end support is experimental.
    bool firstChunk = true;
    auto id = req.id;
    bool wasStopped =
        PerformanceTracer::getInstance().stopTracingAndCollectEvents(
            [this, firstChunk, id](const folly::dynamic& eventsChunk) {
              if (firstChunk) {
                frontendChannel_(cdp::jsonResult(id));
              }
              frontendChannel_(cdp::jsonNotification(
                  "Tracing.dataCollected",
                  folly::dynamic::object("value", eventsChunk)));
            });

    if (!wasStopped) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Tracing session not started"));
    } else {
      frontendChannel_(cdp::jsonNotification(
          "Tracing.tracingComplete",
          folly::dynamic::object("dataLossOccurred", false)));
    }

    frontendChannel_(cdp::jsonResult(req.id));
    return true;
  }

  return false;
}

} // namespace facebook::react::jsinspector_modern
