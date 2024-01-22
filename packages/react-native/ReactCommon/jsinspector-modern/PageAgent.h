/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PageTarget.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/Parsing.h>

#include <functional>
#include <string_view>

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
  PageAgent(
      FrontendChannel frontendChannel,
      PageTarget::SessionMetadata sessionMetadata);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  void handleRequest(const cdp::PreparsedRequest& req);

 private:
  /**
   * Send a simple Log.entryAdded notification with the given
   * \param text. You must ensure that the frontend has enabled Log
   * notifications (using Log.enable) prior to calling this function. In Chrome
   * DevTools, the message will appear in the Console tab along with regular
   * console messages. The difference between Log.entryAdded and
   * Runtime.consoleAPICalled is that the latter requires an execution context
   * ID, which does not exist at the Page level.
   */
  void sendInfoLogEntry(std::string_view text);

  FrontendChannel frontendChannel_;
  const PageTarget::SessionMetadata sessionMetadata_;
};

} // namespace facebook::react::jsinspector_modern
