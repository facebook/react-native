/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "InstanceAgent.h"

#include <jsinspector-modern/cdp/CdpJson.h>

namespace facebook::react::jsinspector_modern {

/**
 * Provides an agent for handling CDP's Tracing.start, Tracing.stop.
 */
class TracingAgent {
 public:
  /**
   * \param frontendChannel A channel used to send responses to the
   * frontend.
   */
  explicit TracingAgent(FrontendChannel frontendChannel)
      : frontendChannel_(std::move(frontendChannel)) {}

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  bool handleRequest(const cdp::PreparsedRequest& req);

  /**
   * Replace the current InstanceAgent with the given one.
   * \param agent The new InstanceAgent. May be null to signify that there is
   * currently no active instance.
   */
  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> agent);

 private:
  /**
   * A channel used to send responses and events to the frontend.
   */
  FrontendChannel frontendChannel_;

  /**
   * Current InstanceAgent. May be null to signify that there is
   * currently no active instance.
   */
  std::shared_ptr<InstanceAgent> instanceAgent_;

  /**
   * Timestamp of when we started tracing of an Instance, will be used as a
   * a start of JavaScript samples recording.
   */
  std::chrono::steady_clock::time_point instanceTracingStartTimestamp_;
};

} // namespace facebook::react::jsinspector_modern
