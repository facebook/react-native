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

/**
 * The maximum number of ProfileChunk trace events
 * that will be sent in a single CDP Tracing.dataCollected message.
 * TODO(T219394401): Increase the size once we manage the queue on OkHTTP side
 * properly and avoid WebSocket disconnections when sending a message larger
 * than 16MB.
 */
const uint16_t PROFILE_TRACE_EVENT_CHUNK_SIZE = 1;

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
        tracing::PerformanceTracer::getInstance().startTracing();

    if (!correctlyStartedPerformanceTracer) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Tracing session already started"));

      return true;
    }

    instanceAgent_->startTracing();
    instanceTracingStartTimestamp_ = HighResTimeStamp::now();
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

    tracing::PerformanceTracer& performanceTracer =
        tracing::PerformanceTracer::getInstance();
    bool correctlyStopped = performanceTracer.stopTracing();
    if (!correctlyStopped) {
      frontendChannel_(cdp::jsonError(
          req.id,
          cdp::ErrorCode::InternalError,
          "Tracing session not started"));

      return true;
    }

    // Send response to Tracing.end request.
    frontendChannel_(cdp::jsonResult(req.id));

    auto dataCollectedCallback = [this](const folly::dynamic& eventsChunk) {
      frontendChannel_(cdp::jsonNotification(
          "Tracing.dataCollected",
          folly::dynamic::object("value", eventsChunk)));
    };
    performanceTracer.collectEvents(
        dataCollectedCallback, TRACE_EVENT_CHUNK_SIZE);

    tracing::RuntimeSamplingProfileTraceEventSerializer serializer(
        performanceTracer,
        dataCollectedCallback,
        PROFILE_TRACE_EVENT_CHUNK_SIZE);
    serializer.serializeAndNotify(
        instanceAgent_->collectTracingProfile().getRuntimeSamplingProfile(),
        instanceTracingStartTimestamp_);

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
