/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/json.h>
#include <jsinspector-modern/PageAgent.h>

namespace facebook::react::jsinspector_modern {

PageAgent::PageAgent(FrontendChannel frontendChannel)
    : frontendChannel_(frontendChannel) {}

void PageAgent::handleRequest(const cdp::PreparsedRequest& req) {
  folly::dynamic res = folly::dynamic::object("id", req.id)(
      "error",
      folly::dynamic::object("code", -32601)(
          "message", req.method + " not implemented yet"));
  std::string json = folly::toJson(res);
  frontendChannel_(json);
}

} // namespace facebook::react::jsinspector_modern
