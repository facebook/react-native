/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingAgent.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <jsinspector-modern/tracing/RuntimeSamplingProfileTraceEventSerializer.h>

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * Threshold for the size Trace Event chunk, that will be flushed out with
 * Tracing.dataCollected event.
 */
const uint16_t TRACE_EVENT_CHUNK_SIZE = 1000;

} // namespace

bool TracingAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Tracing.start") {
    // @cdp Tracing.start support is experimental.
    if (!instanceAgent_) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Couldn't find instance available for Tracing"));

      return true;
    }

    bool correctlyStartedPerformanceTracer =
        PerformanceTracer::getInstance().startTracing();

    if (!correctlyStartedPerformanceTracer) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Tracing session already started"));

      return true;
    }

    instanceAgent_->startTracing();
    instanceTracingStartTimestamp_ = std::chrono::steady_clock::now();
    frontendChannel_(cdp::jsonResult(req.id));

    return true;
  } else if (req.method == "Tracing.end") {
    // @cdp Tracing.end support is experimental.
    if (!instanceAgent_) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Couldn't find instance available for Tracing"));

      return true;
    }
    instanceAgent_->stopTracing();
    tracing::RuntimeSamplingProfileTraceEventSerializer::serializeAndBuffer(
        PerformanceTracer::getInstance(),
        instanceAgent_->collectTracingProfile().getRuntimeSamplingProfile(),
        instanceTracingStartTimestamp_);

    bool correctlyStopped = PerformanceTracer::getInstance().stopTracing();
    if (!correctlyStopped) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Tracing session not started"));

      return true;
    }

    // Send response to Tracing.end request.
    frontendChannel_(cdp::jsonResult(req.id));

    PerformanceTracer::getInstance().collectEvents(
        [this](const folly::dynamic& eventsChunk) {
          frontendChannel_(cdp::jsonNotification(
              "Tracing.dataCollected",
              folly::dynamic::object("value", eventsChunk)));
        },
        TRACE_EVENT_CHUNK_SIZE);

    frontendChannel_(cdp::jsonNotification(
        "Tracing.tracingComplete",
        folly::dynamic::object("dataLossOccurred", false)));

    return true;
  }

  return false;
}

void TracingAgent::setCurrentInstanceAgent(
    std::shared_ptr<InstanceAgent> instanceAgent) {
  instanceAgent_ = std::move(instanceAgent);
}

} // namespace facebook::react::jsinspector_modern
