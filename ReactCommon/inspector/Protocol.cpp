// Copyright 2004-present Facebook. All Rights Reserved.

#include "Protocol.h"

#include "Error.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/Conv.h>

#include <chrono>

namespace facebook {
namespace react {

namespace {

folly::dynamic getCallId(const folly::Optional<int>& callId) {
  if (callId.hasValue()) {
    return callId.value();
  } else {
    return nullptr;
  }
}

}

Method Method::parse(const std::string& formatted) {
  auto splitPos = formatted.find_first_of('.');
  if (splitPos == std::string::npos) {
    throw InspectorException(ErrorCode::InvalidRequest, "Invalid method format");
  }
  return Method(formatted.substr(0, splitPos), formatted.substr(splitPos + 1));
}

Method::Method(std::string domain, std::string name)
  : domain_(std::move(domain))
  , name_(std::move(name)) {}

std::string Method::formatted() const {
  return folly::to<std::string>(domain_, '.', name_);
}

Event::Event(std::string domain, std::string method, folly::dynamic params)
  : method_(std::move(domain), std::move(method))
  , params_(std::move(params)) {}

Event::operator std::string() const {
  auto event = folly::dynamic::object("method", method_.formatted());
  if (!params_.isNull()) {
    event("params", params_);
  }

  return folly::toJson(std::move(event));
}

namespace Timestamp {
double now() {
  using duration = std::chrono::duration<double, std::ratio<1>>;
  auto epoch = std::chrono::duration_cast<duration>(
    std::chrono::system_clock::now().time_since_epoch()
  );
  return epoch.count();
}
}

Error::Error(int callId, ErrorCode code, std::string message)
  : callId_(callId)
  , code_(code)
  , message_(std::move(message)) {}

Error::Error(ErrorCode code, std::string message)
  : code_(code)
  , message_(std::move(message)) {}

Error::operator std::string() const {
  auto errorCode = static_cast<int>(code_);
  return folly::toJson(
    folly::dynamic::object("id", getCallId(callId_))
    ("error", folly::dynamic::object("code", errorCode)("message", message_))
  );
}


}
}
