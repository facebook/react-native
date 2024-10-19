/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CdpJson.h"
#include "InspectorInterfaces.h"

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

 private:
  /**
   * A channel used to send responses and events to the frontend.
   */
  FrontendChannel frontendChannel_;
};

} // namespace facebook::react::jsinspector_modern
