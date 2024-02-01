/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/Parsing.h>
#include <jsinspector-modern/RuntimeAgent.h>
#include <functional>

namespace facebook::react::jsinspector_modern {

class InstanceTarget;

/**
 * An Agent that handles requests from the Chrome DevTools Protocol for the
 * given InstanceTarget.
 */
class InstanceAgent {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param target The InstanceTarget that this agent is attached to. The
   * caller is responsible for ensuring that the InstanceTarget outlives this
   * object.
   * \param runtimeAgent The RuntimeAgent that this agent will use to
   * communicate with the JS runtime.
   */
  explicit InstanceAgent(
      FrontendChannel frontendChannel,
      InstanceTarget& target,
      std::unique_ptr<RuntimeAgent> runtimeAgent);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  bool handleRequest(const cdp::PreparsedRequest& req);

 private:
  FrontendChannel frontendChannel_;
  InstanceTarget& target_;
  std::unique_ptr<RuntimeAgent> runtimeAgent_;
};

} // namespace facebook::react::jsinspector_modern
