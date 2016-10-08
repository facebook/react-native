// Copyright 2004-present Facebook. All Rights Reserved.

#include "MethodCall.h"

#include <folly/json.h>
#include <stdexcept>

namespace facebook {
namespace react {

#define REQUEST_MODULE_IDS 0
#define REQUEST_METHOD_IDS 1
#define REQUEST_PARAMSS 2
#define REQUEST_CALLID 3

std::vector<MethodCall> parseMethodCalls(folly::dynamic&& jsonData) throw(std::invalid_argument) {
  if (jsonData.isNull()) {
    return {};
  }

  if (!jsonData.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>("Did not get valid calls back from JS: ", jsonData.typeName()));
  }

  if (jsonData.size() < REQUEST_PARAMSS + 1) {
    throw std::invalid_argument(
      folly::to<std::string>("Did not get valid calls back from JS: size == ", jsonData.size()));
  }

  auto& moduleIds = jsonData[REQUEST_MODULE_IDS];
  auto& methodIds = jsonData[REQUEST_METHOD_IDS];
  auto& params = jsonData[REQUEST_PARAMSS];
  int  callId = -1;

  if (!moduleIds.isArray() || !methodIds.isArray() || !params.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>("Did not get valid calls back from JS: ", folly::toJson(jsonData)));
  }

  if (moduleIds.size() != methodIds.size() || moduleIds.size() != params.size()) {
    throw std::invalid_argument(
      folly::to<std::string>("Did not get valid calls back from JS: ", folly::toJson(jsonData)));
  }

  if (jsonData.size() > REQUEST_CALLID) {
    if (!jsonData[REQUEST_CALLID].isInt()) {
      throw std::invalid_argument(
        folly::to<std::string>("Did not get valid calls back from JS: %s", folly::toJson(jsonData)));
    } else {
      callId = jsonData[REQUEST_CALLID].getInt();
    }
  }

  std::vector<MethodCall> methodCalls;
  for (size_t i = 0; i < moduleIds.size(); i++) {
    if (!params[i].isArray()) {
      throw std::invalid_argument(
          folly::to<std::string>("Call argument isn't an array"));
    }

    methodCalls.emplace_back(
      moduleIds[i].getInt(),
      methodIds[i].getInt(),
      std::move(params[i]),
      callId);

    // only incremement callid if contains valid callid as callid is optional
    callId += (callId != -1) ? 1 : 0;
  }

  return methodCalls;
}

}}

