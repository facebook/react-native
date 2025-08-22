/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "HostTarget.h"
#include "InspectorInterfaces.h"

#include <jsinspector-modern/cdp/CdpJson.h>
#include <jsinspector-modern/tracing/Timing.h>
#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern {

/**
 * Provides an agent for handling CDP's Tracing.start, Tracing.stop.
 */
class TracingAgent {
 public:
  /**
   * \param frontendChannel A channel used to send responses to the
   * frontend.
   * \param sessionState The state of the session that created this agent.
   * \param hostTargetController An interface to the HostTarget that this agent
   * is attached to. The caller is responsible for ensuring that the
   * HostTargetDelegate and underlying HostTarget both outlive the agent.
   * \param traceRecordingToEmit If set, this is the trace that Host has
   * requested to display in the Frontend.
   */
  TracingAgent(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      HostTargetController& hostTargetController,
      std::optional<tracing::TraceRecordingState> traceRecordingToEmit);

  ~TracingAgent();

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  bool handleRequest(const cdp::PreparsedRequest& req);

 private:
  /**
   * A channel used to send responses and events to the frontend.
   */
  FrontendChannel frontendChannel_;

  SessionState& sessionState_;

  HostTargetController& hostTargetController_;

  /**
   * Emits the captured Trace Recording state in a series of
   * Tracing.dataCollected events, followed by a Tracing.tracingComplete event.
   */
  void emitTraceRecording(tracing::TraceRecordingState state) const;
};

} // namespace facebook::react::jsinspector_modern
