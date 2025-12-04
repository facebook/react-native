/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingAgent.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <jsinspector-modern/tracing/RuntimeSamplingProfileTraceEventSerializer.h>
#include <jsinspector-modern/tracing/TraceEventSerializer.h>
#include <jsinspector-modern/tracing/TraceRecordingStateSerializer.h>
#include <jsinspector-modern/tracing/TracingMode.h>

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
 * TODO(T219394401): Increase the size once we manage the queue on OkHTTP
 side
 * properly and avoid WebSocket disconnections when sending a message larger
 * than 16MB.
 */
const uint16_t PROFILE_TRACE_EVENT_CHUNK_SIZE = 1;

} // namespace

TracingAgent::TracingAgent(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    HostTargetController& hostTargetController)
    : frontendChannel_(std::move(frontendChannel)),
      sessionState_(sessionState),
      hostTargetController_(hostTargetController) {}

TracingAgent::~TracingAgent() {
  // Agents are owned by the session. If the agent is destroyed, it means that
  // the session was destroyed. We should stop pending recording.
  if (sessionState_.hasPendingTraceRecording) {
    hostTargetController_.stopTracing();
  }
}

bool TracingAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Tracing.start") {
    auto& inspector = getInspectorInstance();
    if (inspector.getSystemState().registeredHostsCount > 1) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InternalError,
              "The Tracing domain is unavailable when multiple React Native hosts are registered."));

      return true;
    }

    if (sessionState_.isDebuggerDomainEnabled) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InternalError,
              "Debugger domain is expected to be disabled before starting Tracing"));

      return true;
    }

    bool didNotHaveAlreadyRunningRecording =
        hostTargetController_.startTracing(tracing::Mode::CDP);
    if (!didNotHaveAlreadyRunningRecording) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InvalidRequest,
              "Tracing has already been started"));

      return true;
    }

    sessionState_.hasPendingTraceRecording = true;
    frontendChannel_(cdp::jsonResult(req.id));

    return true;
  } else if (req.method == "Tracing.end") {
    // @cdp Tracing.end support is experimental.
    auto state = hostTargetController_.stopTracing();

    sessionState_.hasPendingTraceRecording = false;
    // Send response to Tracing.end request.
    frontendChannel_(cdp::jsonResult(req.id));

    emitTraceRecording(std::move(state));
    return true;
  }

  return false;
}

void TracingAgent::emitExternalTraceRecording(
    tracing::TraceRecordingState traceRecording) const {
  frontendChannel_(
      cdp::jsonNotification("ReactNativeApplication.traceRequested"));
  emitTraceRecording(std::move(traceRecording));
}

void TracingAgent::emitTraceRecording(
    tracing::TraceRecordingState traceRecording) const {
  auto dataCollectedCallback = [this](folly::dynamic&& eventsChunk) {
    frontendChannel_(
        cdp::jsonNotification(
            "Tracing.dataCollected",
            folly::dynamic::object("value", std::move(eventsChunk))));
  };
  tracing::TraceRecordingStateSerializer::emitAsDataCollectedChunks(
      std::move(traceRecording),
      dataCollectedCallback,
      TRACE_EVENT_CHUNK_SIZE,
      PROFILE_TRACE_EVENT_CHUNK_SIZE);

  frontendChannel_(
      cdp::jsonNotification(
          "Tracing.tracingComplete",
          folly::dynamic::object("dataLossOccurred", false)));
}

} // namespace facebook::react::jsinspector_modern
