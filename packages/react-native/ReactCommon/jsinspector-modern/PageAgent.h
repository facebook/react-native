/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/Parsing.h>
#include <functional>

namespace facebook::react::jsinspector_modern {

/**
 * An Agent that handles requests from the Chrome DevTools Protocol for the
 * given page.
 * The constructor, destructor and all public methods must be called on the
 * same thread.
 */
class PageAgent {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   */
  explicit PageAgent(FrontendChannel frontendChannel);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  void handleRequest(const cdp::PreparsedRequest& req);

 private:
  FrontendChannel frontendChannel_;
};

} // namespace facebook::react::jsinspector_modern
