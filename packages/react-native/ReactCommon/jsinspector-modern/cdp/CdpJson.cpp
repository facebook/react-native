/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpJson.h"

#include <folly/dynamic.h>
#include <folly/json.h>

namespace facebook::react::jsinspector_modern::cdp {

PreparsedRequest preparse(std::string_view message) {
  folly::dynamic parsed = folly::parseJson(message);
  return PreparsedRequest{
      .id = parsed["id"].getInt(),
      .method = parsed["method"].getString(),
      .params = parsed.count("params") != 0u ? parsed["params"] : nullptr};
}

std::string PreparsedRequest::toJson() const {
  folly::dynamic obj = folly::dynamic::object;
  obj["id"] = id;
  obj["method"] = method;
  if (params != nullptr) {
    obj["params"] = params;
  }
  return folly::toJson(obj);
}

std::string jsonError(
    std::optional<RequestId> id,
    ErrorCode code,
    std::optional<std::string> message) {
  auto dynamicError = folly::dynamic::object("code", static_cast<int>(code));
  if (message) {
    dynamicError("message", *message);
  }
  return folly::toJson(
      (id ? folly::dynamic::object("id", *id)
          : folly::dynamic::object("id", nullptr))(
          "error", std::move(dynamicError)));
}

std::string jsonResult(RequestId id, const folly::dynamic& result) {
  return folly::toJson(folly::dynamic::object("id", id)("result", result));
}

std::string jsonNotification(
    std::string_view method,
    std::optional<folly::dynamic> params) {
  auto dynamicNotification = folly::dynamic::object("method", method);
  if (params) {
    dynamicNotification("params", *params);
  }
  return folly::toJson(std::move(dynamicNotification));
}

std::string jsonRequest(
    RequestId id,
    std::string_view method,
    std::optional<folly::dynamic> params) {
  auto dynamicRequest = folly::dynamic::object("id", id)("method", method);
  if (params) {
    dynamicRequest("params", *params);
  }
  return folly::toJson(std::move(dynamicRequest));
}

} // namespace facebook::react::jsinspector_modern::cdp
