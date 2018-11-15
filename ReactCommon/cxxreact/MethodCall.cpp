// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "MethodCall.h"

#include <folly/json.h>
#include <stdexcept>

namespace facebook {
namespace react {

#define REQUEST_MODULE_IDS 0
#define REQUEST_METHOD_IDS 1
#define REQUEST_PARAMSS 2
#define REQUEST_CALLID 3

static const char *errorPrefix = "Malformed calls from JS: ";

std::vector<MethodCall> parseMethodCalls(folly::dynamic&& jsonData) {
  if (jsonData.isNull()) {
    return {};
  }

  if (!jsonData.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>(errorPrefix, "input isn't array but ", jsonData.typeName()));
  }

  if (jsonData.size() < REQUEST_PARAMSS + 1) {
    throw std::invalid_argument(
      folly::to<std::string>(errorPrefix, "size == ", jsonData.size()));
  }

  auto& moduleIds = jsonData[REQUEST_MODULE_IDS];
  auto& methodIds = jsonData[REQUEST_METHOD_IDS];
  auto& params = jsonData[REQUEST_PARAMSS];
  int  callId = -1;

  if (!moduleIds.isArray() || !methodIds.isArray() || !params.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>(errorPrefix, "not all fields are arrays.\n\n", folly::toJson(jsonData)));
  }

  if (moduleIds.size() != methodIds.size() || moduleIds.size() != params.size()) {
    throw std::invalid_argument(
      folly::to<std::string>(errorPrefix, "field sizes are different.\n\n", folly::toJson(jsonData)));
  }

  if (jsonData.size() > REQUEST_CALLID) {
    if (!jsonData[REQUEST_CALLID].isNumber()) {
      throw std::invalid_argument(
        folly::to<std::string>(errorPrefix, "invalid callId", jsonData[REQUEST_CALLID].typeName()));
    }
    callId = jsonData[REQUEST_CALLID].asInt();
  }

  std::vector<MethodCall> methodCalls;
  for (size_t i = 0; i < moduleIds.size(); i++) {
    if (!params[i].isArray()) {
      throw std::invalid_argument(
          folly::to<std::string>(errorPrefix, "method arguments isn't array but ", params[i].typeName()));
    }

    methodCalls.emplace_back(
      moduleIds[i].asInt(),
      methodIds[i].asInt(),
      std::move(params[i]),
      callId);

    // only incremement callid if contains valid callid as callid is optional
    callId += (callId != -1) ? 1 : 0;
  }

  return methodCalls;
}

}}
