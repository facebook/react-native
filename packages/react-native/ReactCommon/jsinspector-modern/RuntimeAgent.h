/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/Parsing.h>

namespace facebook::react::jsinspector_modern {

/**
 * An Agent interface that handles requests from the Chrome DevTools Protocol
 * for a particular JS runtime instance. The exact mechanism of sending
 * responses/events to the frontend is left up to the implementation, but
 * implementations SHOULD use FrontendChannel or a similar abstraction.
 */
class RuntimeAgent {
 public:
  virtual ~RuntimeAgent();

  /**
   * Handle a CDP request. This implementation must perform any synchronization
   * required between the thread on which this method is called and the thread
   * where the JS runtime is executing.
   * \returns true if this agent has responded, or will respond asynchronously,
   * to the request (with either a success or error message). False if the
   * agent expects another agent to respond to the request instead.
   */
  virtual bool handleRequest(const cdp::PreparsedRequest& req) = 0;
};

} // namespace facebook::react::jsinspector_modern
