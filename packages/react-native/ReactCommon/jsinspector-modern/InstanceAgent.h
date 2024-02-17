/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "RuntimeTarget.h"
#include "SessionState.h"

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
class InstanceAgent final {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param target The InstanceTarget that this agent is attached to. The
   * caller is responsible for ensuring that the InstanceTarget outlives this
   * object.
   * \param sessionState The state of the session that created this agent.
   */
  explicit InstanceAgent(
      FrontendChannel frontendChannel,
      InstanceTarget& target,
      SessionState& sessionState);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  bool handleRequest(const cdp::PreparsedRequest& req);

  /**
   * Replace the current RuntimeAgent pageAgent_ with a new one
   * connected to the new RuntimeTarget.
   * \param runtime The new runtime target. May be nullptr to indicate
   * there's no current debuggable runtime.
   */
  void setCurrentRuntime(RuntimeTarget* runtime);

 private:
  void maybeSendExecutionContextCreatedNotification();

  FrontendChannel frontendChannel_;
  InstanceTarget& target_;
  std::shared_ptr<RuntimeAgent> runtimeAgent_;
  SessionState& sessionState_;
};

} // namespace facebook::react::jsinspector_modern
